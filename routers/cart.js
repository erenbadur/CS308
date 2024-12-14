const express = require('express');
const router = express.Router();
const Cart = require('../models/cartModel');
const Product = require('../models/product');
const User = require('../models/user');

async function getOrCreateCart(req, res, next) {
    let userId, sessionId;
    
    if (req.method == "GET") {
        ({ userId, sessionId } = req.query);
    } else  {
        ({ userId, sessionId } = req.body);
    }

    if (!sessionId && !userId) {
        console.log("sessionId or userId is required");
        return res.status(400).json({ error: "sessionId or userId is required"});
    }

    try {
        let cart;

        if (userId) {
            cart = await Cart.findOne({ userId });

            if (!cart) {
                cart = await Cart.create({ userId: userId, sessionId, items: [] });
            }
        } else {
            cart = await Cart.findOne({ sessionId });

            if (!cart) {
                cart = await Cart.create({ userId: userId, sessionId, items: [] });
            }
        }
        req.cart = cart; // Attach the cart to the request
        next();
    } catch (error) {
        console.error('Error managing cart:', error);
        res.status(500).json({ error: 'Error managing cart.' });
    }
}


router.post('/add', getOrCreateCart, async (req, res) => {
    const { productId, quantity, sessionId, userId } = req.body;
    const cart = req.cart;

    console.log('Adding to cart:', { productId, quantity, sessionId, userId });

    try {

        // Check if the product exists
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: `Product with ID ${productId} not found.` });
        }

        if (product.quantityInStock === 0) {
            return res.status(400).json({ error: `Product ${product.name} is out of stock.` });
        }

        // Check if the product is already in the cart
        const existingItem = cart.items.find((item) => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity; // Update quantity
        } else {
            cart.items.push({ productId, quantity });
        }

        await cart.save();

        // Fetch updated product details
        const productIds = cart.items.map((item) => item.productId);
        const products = await Product.find({ productId: { $in: productIds } });

        // Populate cart items with product details
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

        res.status(200).json({ message: 'Item added to cart.', cart: { items: populatedItems } });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


router.get('/get', getOrCreateCart, async (req, res) => {
    const { userId, sessionId } = req.query;
    const cart = req.cart

    console.log('Fetching cart with:', { userId, sessionId });

    try {

        if (!cart) {
            console.warn('Cart not found for:', { userId, sessionId });
            return res.status(404).json({ error: 'Cart not found.' });
        }

        // Fetch and populate product details for cart items
        const productIds = cart.items.map((item) => item.productId);
        const products = await Product.find({ productId: { $in: productIds } }); // Retrieve product details

        // Map product details to cart items
        const productMap = products.reduce((map, product) => {
            map[product.productId] = product; // Create a mapping for easy lookup
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


router.delete('/delete', async (req, res) => {
    const { userId } = req.query;
  
    if (!userId) {
      return res.status(400).json({ error: 'Both sessionId and userId are missing.' });
    }
  
    try {
      if (userId) {
        // Clear cart for logged-in user
        await Cart.deleteMany({ userId });
      }
  
      res.status(200).json({ message: 'Cart cleared successfully.' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ error: 'Failed to clear cart.' });
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
            console.log(`Removing item from cart, but NOT from database: ${productId}`);
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

/* not necessary right now
// Clear Cart Endpoint // might change it with deleting
router.delete('/clear', getOrCreateCart, async (req, res) => {
    const { sessionId, userId } = req.body;
    const cart = req.cart;

    console.log('Clear cart request received:', { sessionId, userId });

    if (!sessionId && !userId) {
        return res.status(400).json({ error: 'Session ID or User ID is required.' });
    }

    try {
        // Clear the items in the cart
        cart.items = [];
        await cart.save();

        console.log('Cart cleared successfully:', { sessionId, userId });

        res.status(200).json({ message: 'Cart cleared successfully.' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});  */

/*
// Cart Deleting Endpoint
router.delete('/delete', getOrCreateCart, async (req, res) => {
    const cart = req.cart;

    console.log('Delete cart request received:', { cart });

    if (!cart) {
        return res.status(404).json({ error: 'Cart not found.' });
    }

    try {
        // Delete the cart
        await Cart.deleteOne({ _id: cart._id });

        console.log('Cart deleted successfully:', { cartId: cart._id });

        res.status(200).json({ message: 'Cart deleted successfully.' });
    } catch (error) {
        console.error('Error deleting cart:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
*/


module.exports = router;
