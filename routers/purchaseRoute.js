const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Delivery = require('../models/delivery');
const User = require('../models/user');
const Cart = require('../models/cartModel');
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

// add endpoint for adding products to the cart. NOTHING TO DO WITH THE PURCHASE
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


    } catch (error) {
        console.error('Error adding product to cart:', error.message);
        res.status(500).json({ error: 'An error occurred while adding the product to the cart.' });
    }
});

// CONFIRMING PAYMENT FOR PURCHASE PAGE
router.post("/confirm-payment", async (req, res) => {
    const { userId, products, shippingAddress } = req.body;

    console.log("Confirming payment for:", { userId, products });

    try {
        console.log("Step 1: Fetching user...");
        const user = await User.findOne({ userId });
        if (!user) {
            console.error("User not found");
            return res.status(404).json({ error: "User not found." });
        }
        console.log("User found:", user);

        if (!shippingAddress) {
            console.error("Shipping address is missing in the request.");
            return res.status(400).json({ error: "Shipping address is missing." });
        }

        console.log("Request Body:", req.body);

        if (!products || products.length === 0) {
            console.error("Products are missing in the request.");
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
                    console.error(`Product ${item.productId} not found or insufficient stock.`);
                    throw new Error(`Product with ID ${item.productId} not found or insufficient stock.`);
                }
                console.log("Product validated:", product);

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

        // Calculate delivery price (can be dynamic)
        const totalDeliveryPrice = 50; // Example delivery price

        // Step 1: Create Purchase History
        const purchase = new PurchaseHistory({
            user: userId,
            products: productDetails,
            status: "confirmed",
            totalRevenue,
            totalProfit,
        });
        await purchase.save();
        console.log("Purchase history saved:", purchase);

        // Step 2: Create Delivery
        const delivery = new Delivery({
            user: userId,
            purchase: purchase._id, // Link to PurchaseHistory
            products: productDetails.map((product) => ({
                productId: product.productId,
                name: product.name,
                quantity: product.quantity,
            })),
            deliveryAddress: shippingAddress,
            status: "processing",
        });
        await delivery.save();
        console.log("Delivery record saved successfully:", delivery);

        // Step 3: Generate Invoice
        const invoiceBuffer = await generateInvoiceFile(user, productDetails, totalRevenue + totalDeliveryPrice, delivery._id);
        const invoiceFilePath = `invoices/Invoice-${Date.now()}.pdf`;

        fs.writeFileSync(invoiceFilePath, invoiceBuffer);

        const newInvoice = new Invoice({
            user: user.userId,
            email: user.email,
            products: productDetails.map((item) => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
            })),
            totalAmount: totalRevenue + totalDeliveryPrice,
            delivery: delivery._id, // Link to Delivery
            invoiceFilePath,
        });
        await newInvoice.save();
        console.log("Invoice saved successfully:", newInvoice);

        // Step 4: Update Purchase History with Invoice and Delivery
        purchase.delivery = delivery._id;
        purchase.invoice = newInvoice._id;
        await purchase.save();
        console.log("Purchase history updated with invoice and delivery:", purchase);

        // Step 5: Send Invoice Email
        await sendInvoiceEmail(user.email, user.username, invoiceBuffer);
        console.log(`Invoice email sent to ${user.email}`);
        await Cart.deleteMany({userId});
        // Response to client
        res.status(200).json({
            message: "Payment confirmed and invoice generated.",
            purchase: {
                id: purchase._id,
                totalRevenue: purchase.totalRevenue,
                deliveryId: delivery._id,
                invoiceId: newInvoice.invoiceId,
            },
            delivery,
            invoice: {
                id: newInvoice.invoiceId,
                totalAmount: newInvoice.totalAmount,
            },
        });
      
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

router.patch('/update-refundable/:purchaseId/:productId', async (req, res) => {
    const { purchaseId, productId } = req.params;
    const { refundable } = req.body;

    console.log(`[DEBUG] Received request to update refundable status for orderId: ${purchaseId}, productId: ${productId}`);
    console.log(`[DEBUG] Refundable value from request body: ${refundable}`);

    try {
        // Find the purchase history entry
        const purchase = await PurchaseHistory.findOne({
            _id: purchaseId,
            'products.productId': productId
        });

        console.log(`[DEBUG] Purchase found: ${purchase ? 'Yes' : 'No'}`);

        if (!purchase) {
            console.warn(`[WARN] No purchase found with purchaseId: ${purchaseId} and productId: ${productId}`);
            return res.status(200).json({ error: `There isn't a product with ${productId} for the purchase ${purchaseId}` });
        }

        // Find the specific product in the products array
        const product = purchase.products.find((prod) => prod.productId === productId);

        console.log(`[DEBUG] Product found in purchase: ${product ? 'Yes' : 'No'}`);

        if (!product) {
            console.warn(`[WARN] Product with productId ${productId} not found in the purchase`);
            return res.status(404).json({ error: `Product with productId ${productId} not found in the purchase` });
        }

        // Update the refundable attribute
        product.refundable = refundable;
        console.log(`[DEBUG] Updated refundable status to: ${product.refundable}`);

        // Save the updated document
        await purchase.save();

        console.log(`[DEBUG] Purchase document saved successfully`);

        // Send success response
        res.status(200).json({
            message: `Product's refundable status updated successfully`,
            updatedProduct: product
        });

    } catch (error) {
        console.error(`[ERROR] Error updating product: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * GET /api/deliveries
 * Fetch all deliveries with optional query parameters for filtering and sorting.
 */
router.get('/', async (req, res) => {
    const { status, sortBy = 'createdAt', order = 'desc' } = req.query;

    try {
        // Build query based on the status filter
        const query = status ? { status } : {};

        // Fetch deliveries from the database
        const deliveries = await Delivery.find(query)
            .populate('purchase', 'purchaseDate user') // Populate purchase details
            .populate('invoice', 'invoiceId totalAmount invoiceDate') // Populate invoice details
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

        if (!deliveries.length) {
            return res.status(404).json({ message: 'No deliveries found.' });
        }

        // Send response
        res.status(200).json({
            message: 'Deliveries fetched successfully.',
            deliveries,
        });
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        res.status(500).json({ error: 'Failed to fetch deliveries.' });
    }
});



router.get('/:deliveryId', async (req, res) => {
    const { deliveryId } = req.params;

    try {
        // Fetch the delivery by ID
        const delivery = await Delivery.findById(deliveryId)
            .populate('purchase', 'purchaseDate user') // Populate purchase details
            .populate('invoice', 'invoiceId totalAmount invoiceDate'); // Populate invoice details

        // Check if the delivery exists
        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found.' });
        }

        // Send the response
        res.status(200).json({
            message: 'Delivery fetched successfully.',
            delivery,
        });
    } catch (error) {
        console.error('Error fetching delivery:', error);
        res.status(500).json({ error: 'Failed to fetch the delivery.' });
    }
});

// Fetch Refund Request by Delivery ID and Product ID
router.get('/refunds/:deliveryId/:productId', async (req, res) => {
    const { deliveryId, productId } = req.params;

    try {
        // Fetch the refund request based on deliveryId and productId
        const refundRequest = await refund.findOne({ deliveryId, productId });

        // Check if the refund request exists
        if (!refundRequest) {
            return res.status(404).json({ error: 'Refund request not found.' });
        }

        // Send the response
        res.status(200).json({
            message: 'Refund request fetched successfully.',
            refundRequest,
        });
    } catch (error) {
        console.error('Error fetching refund request:', error);
        res.status(500).json({ error: 'Failed to fetch the refund request.' });
    }
});

module.exports = router;
