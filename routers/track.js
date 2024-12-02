const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');

// Function to retrieve the product name by ID
async function getProductName(productId) {
    try {
        const product = await Product.findOne({ productId: productId });
        return product ? product.name : 'Unknown Product';
    } catch (error) {
        console.error(`Error retrieving product name for productId ${productId}:`, error);
        return 'Unknown Product';
    }
}

// Endpoint to fetch latest purchase with product names
router.get('/latest', async (req, res) => {
    const { userId, sessionId } = req.query;

    if (!userId && !sessionId) {
        return res.status(400).json({ error: 'Either userId or sessionId is required.' });
    }

    try {
        // Fetch the latest order
        const query = userId ? { user: userId } : { sessionId: sessionId };
        const latestOrder = await Order.findOne(query).sort({ createdAt: -1 });

        if (!latestOrder) {
            return res.status(404).json({ error: 'No recent purchase found.' });
        }

        const purchaseId = latestOrder.purchaseId;
        const relatedOrders = await Order.find({ purchaseId });

        // Attach product names to each order
        const enrichedOrders = await Promise.all(
            relatedOrders.map(async (order) => {
                const productName = await getProductName(order.product);
                return { order, productName };
            })
        );

        res.status(200).json({
            message: 'Latest purchase retrieved successfully.',
            orders: enrichedOrders,
        });
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the orders.' });
    }
});

module.exports = router;
