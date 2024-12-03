const express = require('express');
const router = express.Router();
const Cart = require('../models/cartModel');
const Product = require('../models/product');
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid'); // Import UUID generator

async function getOrCreateCart(req, res, next) {
    //console.log("here req start -------------------");
    //console.log(req.body);
    let { sessionId, userId } =  req.body || req.query; 
    console.log("here is your session id:", sessionId);
    // Generate a `sessionId` if it is missing
    if (!sessionId && !userId){
        //sessionId = uuidv4();
        return res.status(400).json({ error: 'Either sessionId or userId must be provided.' });
    }

    try {
        let cart = await Cart.findOne({ $or: [{ userId }, { sessionId }] });

        if (!cart) {
            cart = await Cart.create({ userId: userId || null, sessionId, items: [] });
        }

        req.cart = cart; // Attach the cart to the request
        next();
    } catch (error) {
        console.error('Error managing cart:', error);
        res.status(500).json({ error: 'Error managing cart.' });
    }
}


router.post('/add', async (req, res) => {
    const { productId, quantity, sessionId, userId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required.' });
    }

    try {
        // Find or create the cart
        let cart = await Cart.findOne({ $or: [{ sessionId }, { userId }] });
        if (!cart) {
            cart = new Cart({ sessionId, userId, items: [] });
        }

        if (userId && !cart.userId) {
            //console.log(cart.userId,userId);
            cart.userId = userId; // If user has logged in, connect the userID to them
            //console.log(cart.userId,userId);
        }

        // Check if the product exists
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: `Product with ID ${productId} not found.` });
        }

        // Check if the product is already in the cart
        const existingItem = cart.items.find((item) => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += quantity; // Update the quantity
        } else {
            // Add a new item to the cart
            cart.items.push({ productId, quantity });
        }

        await cart.save();

        // Fetch updated product details
        const productIds = cart.items.map((item) => item.productId);
        const products = await Product.find({ productId: { $in: productIds } });

        const productMap = products.reduce((map, product) => {
            map[product.productId] = product;
            return map;
        }, {});

        // Populate cart items with product details
        const populatedItems = cart.items.map((item) => {
            const product = productMap[item.productId];
            return {
                productId: item.productId,
                name: product ? product.name : 'Unknown Product',
                price: product ? product.price : 0,
                quantity: item.quantity,
            };
        });

        res.status(200).json({ message: 'Item added to cart.', cart: { items: populatedItems } });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


router.get('/get', async (req, res) => {
    const { sessionId, userId } = req.query; // Get sessionId and userId from query parameters

    console.log("Fetching cart with:", { sessionId, userId }); // Debug log

    // If neither sessionId nor userId is provided, return an error
    if (!sessionId && !userId) {
        return res.status(400).json({ error: 'Either sessionId or userId must be provided.' });
    }

    try {
        // Find the cart based on sessionId or userId
        let cart = await Cart.findOne({ $or: [{ userId }, { sessionId }] });

        if (!cart) {
            // Create a new cart if it doesn't exist
            cart = await Cart.create({ userId: userId || null, sessionId, items: [] });
        }

        // Fetch and populate product details for cart items
        const productIds = cart.items.map((item) => item.productId);
        const products = await Product.find({ productId: { $in: productIds } }); // Retrieve product details

        const productMap = products.reduce((map, product) => {
            map[product.productId] = product; // Create a mapping for easy lookup
            return map;
        }, {});

        // Map cart items with their product details
        const populatedItems = cart.items.map((item) => {
            const product = productMap[item.productId];
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

    console.log('Update Request:', { productId, quantity, cartItems: cart.items }); // Debug log

    try {
        const item = cart.items.find((item) => item.productId === productId);
        if (!item) {
            console.warn(`Item with productId ${productId} not found in cart.`);
            return res.status(404).json({ error: 'Item not found in cart.' });
        }

        if (quantity === 0) {
            cart.items = cart.items.filter((item) => item.productId !== productId);
        } else {
            item.quantity = quantity;
        }

        console.log('Updated Cart Items:', cart.items); // Debug log

        await cart.save();


        const populatedItems = await Promise.all(
            cart.items.map(async (item) => {
                const product = await Product.findOne({ productId: item.productId });
                return {
                    productId: item.productId,
                    name: product ? product.name : 'Unknown Product',
                    price: product ? product.price : 0,
                    quantity: item.quantity,
                };
            })
        );

        console.log('Populated Cart Items:', populatedItems); // Debug log

        res.status(200).json({ message: 'Cart updated successfully.', cart: { items: populatedItems } });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});



// Clear the cart
router.delete('/clear', async (req, res) => {
    const { sessionId, userId } = req.body;

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

