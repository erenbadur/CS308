const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust path for Product model
const User = require('../models/user'); // Adjust path for User model
const PurchaseHistory = require('../models/PurchaseHistory'); // Adjust path as needed


router.post('/add', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    console.log('Adding purchase with userId:', userId, 'productId:', productId, 'quantity:', quantity);
    console.log('Request body:', req.body); // Debugging log

    try {
        // Validate input
        if (!userId || !productId || quantity === undefined) {
            return res.status(400).json({ error: 'All fields (userId, productId, quantity) are required.' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0.' });
        }

        // Find the product using productId (custom field)
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Find the user using userId (custom field)
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check stock
        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: 'Not enough items in stock.' });
        }

        // Decrease stock
        product.quantityInStock -= quantity;
        await product.save();

        // Create purchase history using custom userId and productId
        const purchase = await PurchaseHistory.create({
            user: userId, // Use custom userId
            product: productId, // Use custom productId
            quantity,
        });

        res.status(201).json({ message: 'Purchase added successfully.', purchase });
    } catch (error) {
        console.error('Error adding purchase:', error);
        res.status(500).json({ error: 'An error occurred while adding the purchase.' });
    }
});



router.get('/orders', async (req, res) => {
    try {
        // Fetch all purchase histories
        const orders = await PurchaseHistory.find();

        // If no orders exist
        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found.' });
        }

        // Enrich orders with related product and user details
        const enrichedOrders = await Promise.all(
            orders.map(async (order) => {
                const product = await Product.findOne({ productId: order.product });
                const user = await User.findOne({ userId: order.user });

                return {
                    ...order.toObject(), // Convert Mongoose document to plain object
                    product: product || { error: 'Product not found' },
                    user: user || { error: 'User not found' },
                };
            })
        );

        // Return the enriched orders
        res.status(200).json({ orders: enrichedOrders });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ error: 'An error occurred while fetching all orders.' });
    }
});


router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});


module.exports = router;
