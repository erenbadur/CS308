const express = require('express');
const router = express.Router();
const Cart = require('../models/cartModel');
const Product = require('../models/product');


// Middleware to get or create a cart
async function getOrCreateCart(req, res, next) {
    const { userId, sessionId } = req.body || req.query;
    

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        let cart = await Cart.findOne({ $or: [{ userId }, { sessionId }] });
        if (!cart) {
            cart = await Cart.create({ userId: userId || null, sessionId, items: [] });
        }
        req.cart = cart; // Attach cart to the request
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

    try {
        // Validate product existence
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: `Product with ID ${productId} not found.` });
        }

        // Check if the requested quantity is available
        if (quantity > product.quantityInStock) {
            return res.status(400).json({ error: `Only ${product.quantityInStock} units available.` });
        }

        // Check if the product already exists in the cart
        const existingItem = cart.items.find((item) => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += quantity; // Update quantity
        } else {
            // Add product to the cart
            cart.items.push({ productId, quantity });
        }

        // Save the cart
        cart.updatedAt = new Date();
        await cart.save();

        res.status(200).json({ message: 'Item added to cart.', cart });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Error adding item to cart.' });
    }
});


// Get cart details
// Backend Cart Retrieval Logic
router.get('/get', async (req, res) => {
    const { userId, sessionId } = req.query;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        const cart = await Cart.findOne({ $or: [{ userId }, { sessionId }] });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found.' });
        }

        const productIds = cart.items.map((item) => item.productId);
        const products = await Product.find({ productId: { $in: productIds } });

        const productMap = products.reduce((map, product) => {
            map[product.productId] = product;
            return map;
        }, {});

        const populatedItems = cart.items.map((item) => {
            const product = productMap[item.productId];
            console.log('Product IDs in cart:', productIds);
console.log('Products retrieved from database:', products);

            return {
                productId: item.productId,
                name: product ? product.name : 'Unknown Product',
                price: product ? product.price : 0,
                quantity: item.quantity,
            };
        });

        res.status(200).json({
            userId: cart.userId,
            sessionId: cart.sessionId,
            items: populatedItems,
        });
    } catch (error) {
        console.error('Error retrieving cart:', error);
        res.status(500).json({ error: 'Error retrieving cart.' });
    }
});


router.put('/update', getOrCreateCart, async (req, res) => {
    const { productId, quantity } = req.body;
    const cart = req.cart;

    try {
        const item = cart.items.find((item) => item.productId === productId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart.' });
        }

        if (quantity === 0) {
            // Remove item from cart if quantity is zero
            cart.items = cart.items.filter((item) => item.productId !== productId);
        } else {
            // Update item quantity
            item.quantity = quantity;
        }

        // Save updated cart
        await cart.save();

        // Fetch updated product details
        const productIds = cart.items.map((item) => item.productId);
        const products = await Product.find({ productId: { $in: productIds } });

        const productMap = products.reduce((map, product) => {
            map[product.productId] = product;
            return map;
        }, {});

        const populatedItems = cart.items.map((item) => {
            const product = productMap[item.productId];
            return {
                productId: item.productId,
                name: product ? product.name : 'Unknown Product',
                price: product ? product.price : 0,
                quantity: item.quantity,
            };
        });

        // Return updated cart with populated items
        res.status(200).json({ message: 'Cart updated successfully.', cart: { items: populatedItems } });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Error updating cart.' });
    }
});

// Clear the cart
router.delete('/clear', async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        const cart = await Cart.findOne({ sessionId });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found.' });
        }

        // Clear the cart items
        cart.items = [];
        await cart.save();

        res.status(200).json({ message: 'Cart cleared successfully.' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'An error occurred while clearing the cart.' });
    }
});



module.exports = router;
