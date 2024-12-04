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

// `/confirm-payment` endpoint
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

        // Fetch and validate product details
        const productDetails = await Promise.all(
            products.map(async (item) => {
                const product = await Product.findOne({ productId: item.productId });
                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found.`);
                }
                if (product.quantityInStock < item.quantity) {
                    throw new Error(
                        `Not enough stock for product ${product.name}. Available: ${product.quantityInStock}`
                    );
                }
                return {
                    productId: product.productId,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                };
            })
        );

        // Save a single purchase record for the combined products
        const purchase = new PurchaseHistory({
            user: userId,
            products: productDetails, // Include full product details in the purchase record
            status: "confirmed",
        });

        await purchase.save();

        console.log("Purchase saved successfully:", purchase);

        // Generate a single invoice for the combined purchase
        const invoiceBuffer = await generateInvoice(purchase, productDetails, user);

        // Attach the invoice to the purchase
        purchase.invoice = invoiceBuffer;
        purchase.invoiceContentType = "application/pdf";
        await purchase.save();

        console.log("Invoice generated and attached to the purchase record.");

        // Create a single delivery record
        const delivery = new Delivery({
            purchase: purchase._id,
            user: userId,
            products: productDetails.map((product) => ({
                productId: product.productId,
                name: product.name,
                quantity: product.quantity,
            })), // Include only necessary product fields for the delivery record
            deliveryAddress: shippingAddress,
            status: "processing",
        });

        await delivery.save();

        console.log("Delivery record saved successfully:", delivery);

        // Send invoice email
        await sendInvoiceEmail(user.email, user.username, invoiceBuffer);
        console.log(`Invoice email sent to ${user.email}`);

        // Respond to the client
        res.status(200).json({
            message: "Payment confirmed and invoice generated. Email sent.",
            purchase,
            delivery,
        });

        // Simulate delivery status updates
        simulateDeliveryStatusUpdate(delivery._id);
    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ error: "An error occurred while confirming the payment." });
    }
});


const generateInvoice = async (purchase, productDetails, user) => {
    return new Promise((resolve, reject) => {
        console.log("Generating invoice with:", { purchase, productDetails, user });

        const pdfDoc = new pdf();
        const invoiceChunks = [];

        pdfDoc.on("data", (chunk) => invoiceChunks.push(chunk));
        pdfDoc.on("end", () => resolve(Buffer.concat(invoiceChunks)));
        pdfDoc.on("error", (error) => reject(error));

        // Invoice Header
        pdfDoc.fontSize(20).text("Invoice", { align: "center" });
        pdfDoc.moveDown();

        // Invoice Metadata
        pdfDoc.fontSize(12).text(`Invoice ID: ${purchase._id}`);
        pdfDoc.text(`Date: ${new Date().toLocaleDateString()}`);
        pdfDoc.moveDown();

        // Customer Information
        pdfDoc.text(`Customer: ${user.username}`);
        pdfDoc.text(`Email: ${user.email}`);
        pdfDoc.moveDown();

        // Products Section
        pdfDoc.fontSize(14).text("Products:");
        productDetails.forEach((product, index) => {
            pdfDoc.fontSize(12).text(`${index + 1}. ${product.name}`);
            pdfDoc.text(`   Quantity: ${product.quantity}`);
            pdfDoc.text(`   Price per unit: $${product.price.toFixed(2)}`);
            pdfDoc.text(`   Total: $${(product.price * product.quantity).toFixed(2)}`);
            pdfDoc.moveDown();
        });

        // Grand Total
        const totalAmount = productDetails.reduce(
            (sum, product) => sum + product.price * product.quantity,
            0
        );
        pdfDoc.fontSize(14).text(`Grand Total: $${totalAmount.toFixed(2)}`, { align: "right" });
        pdfDoc.moveDown();

        // Thank You Message
        pdfDoc.text("Thank you for shopping with us!", { align: "center" });
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
