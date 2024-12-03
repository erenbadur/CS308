const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Invoice = require('../models/invoice');
const nodemailer = require('nodemailer');
const path = require('path');
const pdf = require('pdfkit');
const fs = require('fs');


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

const generateInvoicePDF = async (purchase, products, user) => {
    try {
        const doc = new pdf();

        // Ensure the directory exists
        const invoiceDir = './invoices';
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir, { recursive: true });
        }

        // File path for the invoice
        const invoicePath = `${invoiceDir}/invoice-${purchase.purchaseId}.pdf`;
        const writeStream = fs.createWriteStream(invoicePath);

        // Add content to the PDF
        doc.pipe(writeStream);
        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice ID: ${purchase.purchaseId}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        doc.text(`Customer: ${user ? user.name : 'Guest'}`);
        doc.text(`Email: ${user ? user.email : 'N/A'}`);
        doc.moveDown();

        // Add product details
        doc.fontSize(12).text('Products', { underline: true });
        doc.moveDown();
        let totalPrice = 0;

        products.forEach((product) => {
            const totalProductPrice = product.price * product.quantity;
            totalPrice += totalProductPrice;
            doc.text(
                `${product.name} x ${product.quantity} - $${totalProductPrice.toFixed(2)}`
            );
        });

        doc.moveDown();
        doc.fontSize(14).text(`Total Price: $${totalPrice.toFixed(2)}`, { align: 'right' });
        doc.moveDown();
        doc.text('Thank you for your purchase!', { align: 'center' });

        // Finalize the PDF
        doc.end();

        // Wait for the file to be fully written
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // Read the PDF and store it in the database
        const pdfData = fs.readFileSync(invoicePath);
        const invoiceFilename = `invoice-${purchase.purchaseId}.pdf`;

        const invoice = new Invoice({
            name: invoiceFilename,
            pdfData: pdfData,
        });

        await invoice.save();
        console.log('Invoice stored in database successfully!');

        return invoicePath; // Return the file path for further use
    } catch (error) {
        console.error('Error generating and saving invoice:', error);
        throw error; // Propagate the error to the calling function
    }
};




// Middleware to check session or user
async function validateSessionOrUser(req, res, next) {
    const { userId, sessionId } = req.body;

    if (!userId && !sessionId) {
        return res.status(400).json({ error: 'Either userId or sessionId is required.' });
    }

    req.context = { userId, sessionId }; // Attach user or session info to the request
    next();
}

router.post('/order', validateSessionOrUser, async (req, res) => {
    const { products } = req.body; // Expect an array of products [{ productId, quantity }]
    const { userId, sessionId } = req.context;

    try {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Products must be a non-empty array.' });
        }

        // Process each product and fetch details
        const orderItems = [];
        const productDetails = []; // This will store the full product info
        for (const item of products) {
            const { productId, quantity } = item;

            if (!productId || quantity === undefined || quantity <= 0) {
                return res.status(400).json({
                    error: 'Each product must have a valid productId and quantity greater than 0.',
                });
            }

            // Find the product by productId
            const product = await Product.findOne({ productId });
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${productId} not found.` });
            }

            // Check stock
            if (product.quantityInStock < quantity) {
                return res.status(400).json({
                    error: `Not enough stock for product ID ${productId}. Available: ${product.quantityInStock}.`,
                });
            }

            // Add to order items and decrement stock
            orderItems.push({
                productId: product.productId,
                quantity,
            });

            // Push product details for invoice
            productDetails.push({
                name: product.name,
                price: product.price,
                quantity,
            });

            product.quantityInStock -= quantity;
            await product.save();
        }

        // Create the order
        const orderData = {
            products: orderItems,
            status: 'Processing',
        };

        if (userId) {
            const user = await User.findOne({ userId });
            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }
            orderData.user = userId;
        } else {
            orderData.sessionId = sessionId; // Associate with sessionId for guest
        }

        const order = await Order.create(orderData);

        // Simulate delivery status updates
        const deliveryStatuses = ['Processing', 'In-Transit', 'Delivered'];
        let statusIndex = 0;

        const intervalId = setInterval(async () => {
            try {
                if (statusIndex < deliveryStatuses.length - 1) {
                    statusIndex += 1;
                    order.status = deliveryStatuses[statusIndex];
                    await order.save();
                    console.log(`Order ${order._id} status updated to: ${order.status}`);
                } else {
                    clearInterval(intervalId);
                }
            } catch (error) {
                console.error('Error updating order status:', error);
                clearInterval(intervalId);
            }
        }, 60000); // Update status every 60 seconds

        const user = await User.findOne({ userId });
        // Generate invoice as a PDF with product details
        const invoicePath = generateInvoicePDF(order, productDetails, user);

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
        res.status(201).json({
            message: 'Order placed successfully.',
            order,
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'An error occurred while placing the order.' });
    }
});



module.exports = router;
