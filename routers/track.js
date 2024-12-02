const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// Endpoint to get all orders from a user's latest purchase
router.get('/latest', async (req, res) => {
    const { userId, sessionId } = req.query;

    if (!userId && !sessionId) {
        return res.status(400).json({ error: 'Either userId or sessionId is required.' });
    }

    try {
        // Query for the latest purchase based on the userId or sessionId
        const query = userId ? { user: userId } : { sessionId: sessionId };
        
        const latestOrder = await Order.findOne(query).sort({ createdAt: -1 });
        
        if (!latestOrder) {
            return res.status(404).json({ error: 'No recent purchase found.' });
        }

        // Extract the purchaseId from the latest order's creation time
        const purchaseId = latestOrder.purchaseId;

        // Fetch all orders from the same purchaseId
        const relatedOrders = await Order.find({ purchaseId });

        res.status(200).json({
            message: 'Latest purchase retrieved successfully.',
            orders: relatedOrders,
        });
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the orders.' });
    }
});

module.exports = router;
