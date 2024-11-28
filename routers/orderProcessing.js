const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');

// Middleware to check session or user
async function validateSessionOrUser(req, res, next) {
    const { userId, sessionId } = req.body;

    if (!userId && !sessionId) {
        return res.status(400).json({ error: 'Either userId or sessionId is required.' });
    }

    req.context = { userId, sessionId }; // Attach user or session info to the request
    next();
}

// Place an order and track delivery
router.post('/order', validateSessionOrUser, async (req, res) => {
    const { productId, quantity } = req.body;
    const { userId, sessionId } = req.context;

    try {
        if (!productId || quantity === undefined) {
            return res.status(400).json({ error: 'Product ID and quantity are required.' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0.' });
        }

        // Find the product
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Check stock
        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: 'Not enough items in stock.' });
        }

        // Decrease stock
        product.quantityInStock -= quantity;
        await product.save();

        // Create the order
        const orderData = {
            product: product._id,
            quantity,
            status: 'Processing',
        };

        if (userId) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }
            orderData.user = user._id;
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
        }, 5000);

        res.status(201).json({
            message: 'Order placed successfully.',
            order,
            stockRemaining: product.quantityInStock,
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'An error occurred while placing the order.' });
    }
});

module.exports = router;
