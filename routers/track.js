const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const Invoice = require('../models/invoice');

// Function to retrieve product details by ID
async function getProductDetails(productId) {
    try {
        const product = await Product.findOne({ productId });
        return product ? { name: product.name, productId: product.productId, price: product.price } : { name: 'Unknown Product', productId };
    } catch (error) {
        console.error(`Error retrieving product details for productId ${productId}:`, error);
        return { name: 'Unknown Product', productId };
    }
}

// Endpoint to fetch the latest order with product details
router.get('/latest', async (req, res) => {
    const { userId, sessionId } = req.query;

    if (!userId && !sessionId) {
        return res.status(400).json({ error: 'Either userId or sessionId is required.' });
    }

    try {
        // Fetch the latest order for the user or session
        const query = userId ? { user: userId } : { sessionId: sessionId };
        const latestOrder = await Order.findOne(query).sort({ createdAt: -1 });

        if (!latestOrder) {
            return res.status(404).json({ error: 'No recent order found.' });
        }

        // Enrich the products in the order with their details
        const enrichedProducts = await Promise.all(
            latestOrder.products.map(async (product) => {
                const productDetails = await getProductDetails(product.productId);
                return {
                    ...productDetails,
                    quantity: product.quantity,
                };
            })
        );

        res.status(200).json({
            message: 'Latest order retrieved successfully.',
            order: {
                orderId: latestOrder._id,
                purchaseId: latestOrder.purchaseId,
                status: latestOrder.status,
                products: enrichedProducts,
                createdAt: latestOrder.createdAt,
            },
        });
    } catch (error) {
        console.error('Error retrieving the latest order:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the latest order.' });
    }
});

router.get('/invoice/:name', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ name: req.params.name });  // Find by filename (name)
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Send the invoice PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${invoice.name}"`);
        res.send(invoice.pdfData);
    } catch (error) {
        console.error('Error retrieving invoice:', error);
        res.status(500).json({ error: 'Failed to retrieve invoice' });
    }
});


module.exports = router;
