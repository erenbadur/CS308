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
            from: `"N308" <${process.env.EMAIL_USER}>`, // Replace with your email
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

    // Add a PNG image
    const logoPath = path.join(__dirname, '../src/logo.png'); // Adjust the path to your PNG file
    try {
        doc.image(logoPath, {
            fit: [150, 100], // Specify the size of the image
            align: 'center',
        });
        doc.moveDown();
    } catch (error) {
        console.error("Error adding PNG to PDF:", error);
    }

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

        // Find user
        const user = userId ? await User.findOne({ userId }) : null;
        if (userId && !user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Find product
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Check stock
        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: 'Not enough items in stock.' });
        }

        // Deduct stock
        product.quantityInStock -= quantity;
        await product.save();

        // Save purchase history
        const purchase = new PurchaseHistory({
            user: userId || null,
            product: productId,
            quantity,
        });

        // Generate invoice as PDF and save it as binary in DB
        const pdfDoc = new pdf();
        const invoiceChunks = [];
        pdfDoc.on('data', (chunk) => invoiceChunks.push(chunk));
        pdfDoc.on('end', async () => {
            const invoiceBuffer = Buffer.concat(invoiceChunks);
            purchase.invoice = invoiceBuffer;
            purchase.invoiceContentType = 'application/pdf';
            await purchase.save(); // Save the purchase with the invoice in DB

            // Send invoice email if user exists
            if (user && user.email) {
                const emailContent = `
                    <h1>Order Confirmation</h1>
                    <p>Dear ${user.name || 'Customer'},</p>
                    <p>Thank you for your purchase! Please find your invoice attached.</p>
                    <p>Thank you for shopping with us!</p>
                `;
                try {
                    await transporter.sendMail({
                        from: `"N308" <${process.env.EMAIL_USER}>`,
                        to: user.email,
                        subject: 'Your Order Invoice',
                        html: emailContent,
                        attachments: [
                            {
                                filename: 'Invoice.pdf',
                                content: invoiceBuffer,
                            },
                        ],
                    });
                } catch (error) {
                    console.error('Error sending email:', error);
                }
            }

            res.status(201).json({ message: 'Purchase completed successfully.', purchase });
        });

        // Add content to the PDF document
        pdfDoc.fontSize(20).text('Invoice', { align: 'center' });
        pdfDoc.moveDown();
        pdfDoc.fontSize(12).text(`Invoice ID: ${purchase._id}`);
        pdfDoc.text(`Date: ${new Date().toLocaleDateString()}`);
        pdfDoc.moveDown();
        pdfDoc.text(`Customer: ${user ? user.name : 'Guest'}`);
        pdfDoc.text(`Email: ${user ? user.email : 'N/A'}`);
        pdfDoc.moveDown();
        pdfDoc.text(`Product: ${product.name}`);
        pdfDoc.text(`Quantity: ${purchase.quantity}`);
        pdfDoc.text(`Price per unit: $${product.price.toFixed(2)}`);
        pdfDoc.text(`Total: $${(product.price * purchase.quantity).toFixed(2)}`);
        pdfDoc.moveDown();
        pdfDoc.text('Thank you for your purchase!', { align: 'center' });
        pdfDoc.end();
    } catch (error) {
        console.error('Error adding purchase:', error);
        res.status(500).json({ error: 'An error occurred while adding the purchase.' });
    }
});



router.get('/orders', async (req, res) => {
    const { userId, productId } = req.query;

    try {
        // Check if the user has purchased the product
        const purchase = await PurchaseHistory.findOne({ user: userId, product: productId });

        // Send the response with hasPurchased field
        res.status(200).json({ hasPurchased: !!purchase });
    } catch (error) {
        console.error('Error checking purchase history:', error);
        res.status(500).json({ error: 'An error occurred while checking purchase history.' });
    }
});




router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});


module.exports = router;
