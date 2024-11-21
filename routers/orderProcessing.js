const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust path for Product model
const User = require('../models/user'); // Adjust path for User model
const Order = require('../models/order'); // Adjust path for Order model

// Place an order and track delivery
router.post('/order', async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        if (!userId || !productId || quantity === undefined) {
            return res.status(400).json({ error: 'All fields (userId, productId, quantity) are required.' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0.' });
        }

        console.log('Product ID:', productId);

        // Find the product by productId
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Find the user by userId
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check stock
        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: 'Not enough items in stock.' });
        }

        // Reduce stock and save
        product.quantityInStock -= quantity;
        await product.save();

        // Create the order
        const order = await Order.create({
            user: user._id,
            product: product._id,
            quantity,
            status: 'Processing',
        });

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


router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});

module.exports = router;
