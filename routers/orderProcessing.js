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
    const doc = new pdf();

    // File path for the invoice
    const invoicePath = `./invoices/invoice-${purchase.purchaseId}.pdf`;
    doc.pipe(fs.createWriteStream(invoicePath)); // Saving the file to the local folder

    // Add invoice details to the PDF
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${purchase.purchaseId}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Customer: ${user ? user.name : 'Guest'}`);
    doc.text(`Email: ${user ? user.email : 'N/A'}`);
    doc.moveDown();

    // Add Products heading
    doc.fontSize(12).text('Products', { underline: true });
    doc.moveDown();

    let totalPrice = 0;

    // Add products and total price for the order
    products.forEach((product) => {
        const totalProductPrice = product.price * product.quantity;
        totalPrice += totalProductPrice;

        // Add product details
        doc.fontSize(12).text(
            `${product.name} x ${product.quantity} - $${totalProductPrice.toFixed(2)}`
        );
    });

    // Add total price at the end of the invoice
    doc.moveDown();
    doc.fontSize(14).text(`Total Price: $${totalPrice.toFixed(2)}`, { align: 'right' });

    doc.moveDown();
    doc.text('Thank you for your purchase!', { align: 'center' });

    // Finalize the PDF
    doc.end();

    // Once PDF is generated, read it and store it in the database
    doc.on('end', async () => {
        try {
            // Read the PDF file into a buffer
            const pdfData = fs.readFileSync(invoicePath); // Reading the file as binary data

            const invoiceFilename = `invoice-${purchase.purchaseId}.pdf`;

            // Store the invoice in the database
            const invoice = new Invoice({
                name: invoiceFilename,
                pdfData: pdfData,  // Store the PDF as binary data
            });

            await invoice.save();  // Save invoice to DB

            // Optionally, associate the invoice with the order
            purchase.invoices.push(invoice._id);
            await purchase.save();

            console.log('Invoice stored in database successfully!');
        } catch (error) {
            console.error('Error saving invoice to database:', error);
        }
    });

    return invoicePath;  // Return the file path where the PDF is saved
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
