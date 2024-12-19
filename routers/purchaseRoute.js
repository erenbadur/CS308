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
const Invoice = require('../models/invoice'); // Import Invoice model

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

        // Create a purchase record (reserved status)
        const purchase = new PurchaseHistory({
            user: userId,
            products: [
                {
                    productId: product.productId,
                    name: product.name,
                    price: product.price,
                    quantity,
                },
            ],
            status: 'reserved',
        });

        await purchase.save();

        res.status(201).json({
            message: 'Product added to cart and reserved.',
            purchase,
        });
    } catch (error) {
        console.error('Error adding product to cart:', error.message);
        res.status(500).json({ error: 'An error occurred while adding the product to the cart.' });
    }
});



router.post("/confirm-payment", async (req, res) => {
    const { userId, products, shippingAddress } = req.body;

    console.log("Confirming payment for:", { userId, products });

    try {
        // Ensure the user exists
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Validate products
        if (!products || products.length === 0) {
            return res.status(400).json({ error: "No products provided for payment confirmation." });
        }

        let totalRevenue = 0;
        let totalProfit = 0;

        // Validate stock and calculate revenue/profit
        const productDetails = await Promise.all(
            products.map(async (item) => {
                const product = await Product.findOneAndUpdate(
                    { productId: item.productId, quantityInStock: { $gte: item.quantity } },
                    { $inc: { quantityInStock: -item.quantity } },
                    { new: true }
                );

                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found or insufficient stock.`);
                }

                const revenue = product.price * item.quantity;
                const profit = revenue - (product.costPrice || 0) * item.quantity;

                totalRevenue += revenue;
                totalProfit += profit;

                return {
                    productId: product.productId,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    total: revenue,
                };
            })
        );

        // Create a purchase record
        const purchase = new PurchaseHistory({
            user: userId,
            products: productDetails,
            status: "confirmed",
            purchaseDate: new Date(),
            totalRevenue,
            totalProfit,
        });
        await purchase.save();

        console.log("Purchase record saved:", purchase);

        // Calculate delivery price (can be dynamic)
        const totalDeliveryPrice = 50; // Example delivery price

        // Create delivery record
        const delivery = new Delivery({
            purchase: purchase._id,
            user: userId,
            products: productDetails.map((product) => ({
                productId: product.productId,
                name: product.name,
                quantity: product.quantity,
            })),
            deliveryAddress: shippingAddress,
            status: "processing",
            totalPrice: totalDeliveryPrice, // Include the total delivery price
        });
        await delivery.save();

        console.log("Delivery record saved successfully:", delivery);

        // Generate invoice and save to the Invoice model
        const invoiceBuffer = await generateInvoiceFile(user, productDetails, totalRevenue, delivery);
        const invoiceFilePath = `invoices/Invoice-${Date.now()}.pdf`;

        fs.writeFileSync(invoiceFilePath, invoiceBuffer);

        const newInvoice = new Invoice({
            user: user._id,
            email: user.email,
            products: productDetails.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
            })),
            totalAmount: totalRevenue + totalDeliveryPrice, // Include delivery price in total
            delivery: {
                deliveryId: delivery._id,
                totalPrice: delivery.totalPrice,
                status: delivery.status,
                address: delivery.deliveryAddress,
            },
            invoiceFilePath,
        });
        await newInvoice.save();

        console.log("Invoice saved successfully:", newInvoice);

        // Send invoice email
        await sendInvoiceEmail(user.email, user.username, invoiceBuffer);
        console.log(`Invoice email sent to ${user.email}`);

        // Response to client
        res.status(200).json({
            message: "Payment confirmed and invoice generated.",
            invoice: {
                id: newInvoice.invoiceId,
                totalAmount: newInvoice.totalAmount,
                filePath: invoiceFilePath,
                delivery: newInvoice.delivery,
            },
            delivery,
        });

        // Simulate delivery updates
        simulateDeliveryStatusUpdate(delivery._id);
    } catch (error) {
        console.error("Error confirming payment:", error.message);
        res.status(400).json({ error: error.message });
    }
});


// Generate invoice PDF and return as buffer
const generateInvoiceFile = (user, products, totalAmount, invoiceId) => {
    return new Promise((resolve, reject) => {
        const pdfDoc = new pdf();
        const invoiceChunks = [];

        pdfDoc.on('data', (chunk) => invoiceChunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(invoiceChunks)));
        pdfDoc.on('error', (error) => reject(error));

        // Invoice Header
        pdfDoc.fontSize(20).text('Invoice', { align: 'center' }).moveDown();

        // Invoice Metadata
        pdfDoc.fontSize(12).text(`Invoice ID: ${invoiceId}`); // Use actual Invoice ID
        pdfDoc.text(`Date: ${new Date().toLocaleDateString()}`).moveDown();

        // Customer Information
        pdfDoc.text(`Customer: ${user.username}`);
        pdfDoc.text(`Email: ${user.email}`).moveDown();

        // Products Section
        pdfDoc.fontSize(14).text('Products:');
        products.forEach((product, index) => {
            pdfDoc.fontSize(12).text(`${index + 1}. ${product.name}`);
            pdfDoc.text(`   Quantity: ${product.quantity}`);
            pdfDoc.text(`   Price per unit: $${product.price.toFixed(2)}`);
            pdfDoc.text(`   Total: $${product.total.toFixed(2)}`).moveDown();
        });

        // Grand Total
        pdfDoc.fontSize(14).text(`Grand Total: $${totalAmount.toFixed(2)}`).moveDown();
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

// Endpoint to check if a user has purchased a product
router.get('/:userId/:productId', async (req, res) => {
    const { userId, productId } = req.params;

    try {
        // Check if the user has purchased the product
        const purchase = await PurchaseHistory.findOne({
            user: userId,
            'products.productId': productId, // Check if the productId exists in the products array
            status: 'confirmed', // Ensure it's a completed purchase
        });

        if (purchase) {
            res.status(200).json({ hasPurchased: true });
        } else {
            res.status(404).json({ hasPurchased: false });
        }
    } catch (error) {
        console.error('Error checking purchase history:', error);
        res.status(500).json({ error: 'An error occurred while checking the purchase history.' });
    }
});



// Test endpoint
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});

module.exports = router;


