const express = require('express');
const router = express.Router();
const Cart = require('../models/cartModel');
const Product = require('../models/product'); 
const User = require('../models/user'); 


// Middleware to get or create a cart
async function getOrCreateCart(req, res, next) {
    const { userId, sessionId } = req.body || req.query;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        let cart = await Cart.findOne({ $or: [{ userId }, { sessionId }] }).populate('items.productId');
        if (!cart) {
            cart = await Cart.create({ userId: userId || null, sessionId, items: [] });
        }
        req.cart = cart; // Attach cart to request
        next();
    } catch (error) {
        console.error('Error managing cart:', error);
        res.status(500).json({ error: 'Error managing cart.' });
    }
}

// Add item to cart
router.post('/add', getOrCreateCart, async (req, res) => {
    const { productId, quantity } = req.body;
    const cart = req.cart;
    const product = await Product.findOne({ productId }); // Query by `productId`
    if (!product) {
        return res.status(404).json({ error: `Product with ID ${productId} not found.` });
    }
    
    try {
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: `Product with ID ${productId} not found.` });
        }
        if (quantity > product.quantityInStock) {
            return res.status(400).json({ error: `Only ${product.quantityInStock} units available.` });
        }

        const existingItem = cart.items.find((item) => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }

        cart.updatedAt = new Date();
        await cart.save();
        res.status(200).json({ message: 'Item added to cart.', cart });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Error adding item to cart.' });
    }
});

router.put('/update', getOrCreateCart, async (req, res) => {
    const { productId, quantity } = req.body;
    const cart = req.cart;
    console.log('Querying product with productId:', productId);
    const product = await Product.findOne({ productId }); // Query by `productId`
    if (!product) {
        console.error(`Product with ID ${productId} not found.`);
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a non-negative integer.' });
    }

    try {
        console.log('Querying product with productId:', productId);
        const product = await Product.findOne({ productId }); // Query by custom productId
        if (!product) {
            return res.status(404).json({ error: `Product with ID ${productId} not found.` });
        }
        if (quantity > product.quantityInStock) {
            return res.status(400).json({ error: `Only ${product.quantityInStock} units available.` });
        }

        const item = cart.items.find((item) => item.productId === productId);

        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart.' });
        }

        if (quantity === 0) {
            cart.items = cart.items.filter((item) => item.productId !== productId);
        } else {
            item.quantity = quantity;
        }

        cart.updatedAt = new Date();
        await cart.save();
        res.status(200).json({ message: 'Cart updated.', cart });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Error updating cart.' });
    }
});


// Get cart details
router.get('/get', async (req, res) => {
    const { userId, sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        const cart = await Cart.findOne({ $or: [{ userId }, { sessionId }] }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found.' });
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error retrieving cart:', error);
        res.status(500).json({ error: 'Error retrieving cart.' });
    }
});

module.exports = router;
