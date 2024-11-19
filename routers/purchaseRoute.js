const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust path for Product model
const User = require('../models/user'); // Adjust path for User model
const PurchaseHistory = require('../models/PurchaseHistory'); // Adjust path as needed


// Add a purchase to purchase history
router.post('/add', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    console.log('Purchase routes loaded.');
    try {
        // Validate request body
        if (!userId || !productId || quantity === undefined) {
            

            return res.status(400).json({ error: 'All fields (userId, productId, quantity) are required.' });
        }

        if (!(quantity > 0)) {
            return res.status(400).json({ error: 'Quantity must be greater than 0.' });
        }

        // Find the product by productId (custom field)
        console.log("Received productId:", productId);
        const product = await Product.findOne({ productId: productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Find the user by userId (custom field)
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check if there is sufficient stock
        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: 'Not enough items in stock.' });
        }

        // Reduce product stock
        product.quantityInStock -= quantity;
        await product.save();

        // Add the purchase to the PurchaseHistory
        const purchase = await PurchaseHistory.create({
            user: user._id, // Reference MongoDB `_id` for the user
            product: product._id, // Reference MongoDB `_id` for the product
            quantity,
        });

        // Respond with success
        res.status(201).json({ message: 'Purchase added successfully.', purchase });
    } catch (error) {
        console.error('Error adding purchase:', error);
        res.status(500).json({ error: 'An error occurred while adding the purchase.' });
    }
});

router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Test route works!' });
});


module.exports = router;
