const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');

// Place an order and track delivery
router.post('/order', async (req, res) => {
    const { productId, quantity, userId } = req.body;

    console.log('Placing order:', { userId, productId, quantity });

    try {
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid productId or quantity.' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'User must be logged in to place an order.' });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: `Not enough stock. Available stock: ${product.quantityInStock}` });
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { productId, quantityInStock: { $gte: quantity } },
            { $inc: { quantityInStock: -quantity } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(400).json({ error: 'Failed to update stock. Insufficient stock.' });
        }

        console.log('Stock successfully deducted. Remaining stock:', updatedProduct.quantityInStock);

        const orderData = {
            product: product._id,
            quantity,
            status: 'Processing', // Initial status
            user: userId,
        };

        const order = await Order.create(orderData);

        console.log('Order created successfully:', order);

        res.status(201).json({
            message: 'Order placed successfully.',
            order,
            stockRemaining: updatedProduct.quantityInStock,
        });
    } catch (error) {
        console.error('Error placing order:', error);

        if (error.message.includes('Order') && productId && quantity) {
            await Product.findOneAndUpdate(
                { productId },
                { $inc: { quantityInStock: quantity } }
            );
            console.log('Stock rolled back due to order creation failure.');
        }

        res.status(500).json({ error: 'An error occurred while placing the order.' });
    }




});




module.exports = router;
