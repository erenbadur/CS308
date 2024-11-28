const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust path for Product model
const User = require('../models/user'); // Adjust path for User model
const nodemailer = require('nodemailer');
const path = require('path');
const pdf = require('pdfkit');
const fs = require('fs');
const PurchaseHistory = require('../models/PurchaseHistory'); // Adjust path as needed

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../mail.env') });

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Email from .env
        pass: process.env.EMAIL_PASS, // Password from .env
    },
});

// Function to send email with invoice
const sendEmailWithInvoice = async (to, subject, htmlContent, attachmentPath) => {
    try {
        await transporter.sendMail({
            from: `"Your Store Name" <${process.env.EMAIL_USER}>`, // Replace with your email
            to,
            subject,
            html: htmlContent,
            attachments: [
                {
                    filename: 'Invoice.pdf',
                    path: attachmentPath,
                },
            ],
        });
        console.log(`Email with invoice sent to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};

// Function to generate invoice as a PDF
const generateInvoicePDF = (purchase, product, user) => {
    const doc = new pdf();

    // File path for the invoice
    const invoicePath = `./invoices/invoice-${purchase._id}.pdf`;
    doc.pipe(fs.createWriteStream(invoicePath));

    // Add invoice details to the PDF
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${purchase._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Customer: ${user ? user.name : 'Guest'}`);
    doc.text(`Email: ${user ? user.email : 'N/A'}`);
    doc.moveDown();
    doc.text(`Product: ${product.name}`);
    doc.text(`Quantity: ${purchase.quantity}`);
    doc.text(`Price per unit: $${product.price.toFixed(2)}`);
    doc.text(`Total: $${(product.price * purchase.quantity).toFixed(2)}`);
    doc.moveDown();
    doc.text('Thank you for your purchase!', { align: 'center' });

    // Finalize the PDF
    doc.end();

    return invoicePath;
};


router.post('/add', async (req, res) => {
    const { userId, sessionId, productId, quantity } = req.body;
    console.log('Adding purchase with userId:', userId, 'productId:', productId, 'quantity:', quantity);

    try {
        if (!userId && !sessionId) {
            return res.status(400).json({ error: 'userId or sessionId is required.' });
        }

        // Correctly find user by userId as a string
        const user = userId ? await User.findOne({ userId }) : null;
        if (userId && !user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Find product by productId
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Check stock availability
        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: 'Not enough items in stock.' });
        }

        // Deduct stock
        product.quantityInStock -= quantity;
        await product.save();

        // Save purchase history
        const purchase = await PurchaseHistory.create({
            user: userId || null,
            sessionId: sessionId || null,
            product: productId,
            quantity,
        });

        // Generate invoice as a PDF
        const invoicePath = generateInvoicePDF(purchase, product, user);

        // Send email with invoice if user exists
        if (user && user.email) {
            const emailContent = `
                <h1>Order Confirmation</h1>
                <p>Dear ${user.name || 'Customer'},</p>
                <p>Thank you for your purchase! Please find your invoice attached.</p>
                <p>We are processing your order and will update you once it's shipped.</p>
                <p>Thank you for shopping with us!</p>
            `;
            await sendEmailWithInvoice(user.email, 'Your Order Invoice', emailContent, invoicePath);
        }

        res.status(201).json({ message: 'Purchase added successfully. Invoice sent to email.', purchase });
    } catch (error) {
        console.error('Error adding purchase:', error);
        res.status(500).json({ error: 'An error occurred while adding the purchase.' });
    }
});





router.get('/orders', async (req, res) => {
    try {
        // Fetch all purchase histories
        const orders = await PurchaseHistory.find();

        // If no orders exist
        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found.' });
        }

        // Enrich orders with related product and user details
        const enrichedOrders = await Promise.all(
            orders.map(async (order) => {
                const product = await Product.findOne({ productId: order.product });
                const user = await User.findOne({ userId: order.user });

                return {
                    ...order.toObject(), // Convert Mongoose document to plain object
                    product: product || { error: 'Product not found' },
                    user: user || { error: 'User not found' },
                };
            })
        );

        // Return the enriched orders
        res.status(200).json({ orders: enrichedOrders });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ error: 'An error occurred while fetching all orders.' });
    }
});


router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});


module.exports = router;
