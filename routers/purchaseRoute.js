const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Delivery = require('../models/delivery');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const path = require('path');
const pdf = require('pdfkit');
const fs = require('fs');
const PurchaseHistory = require('../models/PurchaseHistory');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../mail.env') });

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


// Add product to cart or make a purchase
router.post('/add', async (req, res) => {
    const { userId, productId, quantity } = req.body;

    console.log('Adding product to cart:', { userId, productId, quantity });

    try {
        if (!userId || !productId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid userId, productId, or quantity.' });
        }

        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: `Not enough stock. Available: ${product.quantityInStock}` });
        }

        // Deduct stock atomically
        const updatedProduct = await Product.findOneAndUpdate(
            { productId, quantityInStock: { $gte: quantity } },
            { $inc: { quantityInStock: -quantity } },
            { new: true }
        );

        console.log('Stock successfully deducted. Remaining stock:', updatedProduct.quantityInStock);

        // Create a purchase record with a status of "reserved"
        const purchase = new PurchaseHistory({
            user: userId,
            product: productId,
            quantity,
            status: 'reserved',
        });

        await purchase.save();

        res.status(201).json({
            message: 'Product added successfully and purchase recorded.',
            purchase,
        });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'An error occurred while adding the product to the cart.' });
    }
});

router.post('/confirm-payment', async (req, res) => {
    const { userId, productId, quantity, shippingAddress } = req.body;

    console.log('Confirming payment for:', { userId, productId, quantity });

    try {
        // Find the product
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Find the user
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Find the purchase record
        const purchase = await PurchaseHistory.findOne({ user: userId, product: productId, status: 'reserved' });
        if (!purchase) {
            return res.status(404).json({ error: 'No reserved purchase found for this user and product.' });
        }

        if (!shippingAddress || !shippingAddress.address) {
            return res.status(400).json({ error: 'Shipping address is missing or incomplete.' });
        }

        // Update purchase status to "confirmed"
        purchase.status = 'confirmed';
        await purchase.save();
        console.log('Payment status updated to confirmed.');

        // Generate invoice
        const invoiceBuffer = await generateInvoice(purchase, product, user);

        // Attach invoice to the purchase
        purchase.invoice = invoiceBuffer;
        purchase.invoiceContentType = 'application/pdf';
        await purchase.save();
        console.log('Invoice generated and attached to the purchase record.');

        // Create a delivery record
        const delivery = new Delivery({
            purchase: purchase._id,
            user: userId,
            product: productId,
            quantity: purchase.quantity,
            deliveryAddress: shippingAddress,
            status: 'processing',
        });
        await delivery.save();

        // Send email with invoice
        await sendInvoiceEmail(user.email, user.name, invoiceBuffer);
        console.log(`Invoice email sent to ${user.email}`);

        // Respond to the client
        res.status(200).json({
            message: 'Payment confirmed, order processed, and invoice sent via email.',
            purchase: {
                ...purchase.toObject(),
                product: { name: product.name }, // Include product name in response
            },
            delivery,
        });

        // Simulate delivery status updates
        simulateDeliveryStatusUpdate(delivery._id);
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ error: 'An error occurred while confirming the payment.' });
    }
});

// Helper function to generate invoice
const generateInvoice = async (purchase, product, user) => {
    return new Promise((resolve, reject) => {
        const pdfDoc = new pdf();
        const invoiceChunks = [];

        pdfDoc.on('data', (chunk) => invoiceChunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(invoiceChunks)));
        pdfDoc.on('error', (error) => reject(error));

        pdfDoc.fontSize(20).text('Invoice', { align: 'center' });
        pdfDoc.moveDown();
        pdfDoc.fontSize(12).text(`Invoice ID: ${purchase._id}`);
        pdfDoc.text(`Date: ${new Date().toLocaleDateString()}`);
        pdfDoc.moveDown();
        pdfDoc.text(`Customer: ${user.name}`);
        pdfDoc.text(`Email: ${user.email}`);
        pdfDoc.moveDown();
        pdfDoc.text(`Product: ${product.name}`);
        pdfDoc.text(`Quantity: ${purchase.quantity}`);
        pdfDoc.text(`Price per unit: $${product.price.toFixed(2)}`);
        pdfDoc.text(`Total: $${(product.price * purchase.quantity).toFixed(2)}`);
        pdfDoc.moveDown();
        pdfDoc.text('Thank you for shopping with us!', { align: 'center' });
        pdfDoc.end();
    });
};

// Helper function to send email with invoice
const sendInvoiceEmail = async (email, name, invoiceBuffer) => {
    const emailContent = `
        <h1>Order Confirmation</h1>
        <p>Dear ${name},</p>
        <p>Thank you for confirming your payment! Your order is being processed for delivery.</p>
        <p>Please find your invoice attached.</p>
    `;

    await transporter.sendMail({
        from: `"N308" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Order Confirmation and Invoice',
        html: emailContent,
        attachments: [
            {
                filename: 'Invoice.pdf',
                content: invoiceBuffer,
            },
        ],
    });
};


// Simulate delivery status updates
const simulateDeliveryStatusUpdate = async (deliveryId) => {
    try {
        const statuses = ['processing', 'in-transit', 'delivered'];
        let index = 0;

        const interval = setInterval(async () => {
            if (index >= statuses.length) {
                clearInterval(interval);
                return;
            }

            const delivery = await Delivery.findById(deliveryId);
            if (!delivery) {
                clearInterval(interval);
                return;
            }

            delivery.status = statuses[index];
            await delivery.save();
            console.log(`Delivery ${deliveryId} status updated to: ${statuses[index]}`);
            index++;
        }, 10000); // Update status every 10 seconds
    } catch (error) {
        console.error('Error updating delivery status:', error);
    }
};


// Test endpoint
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});

module.exports = router;
