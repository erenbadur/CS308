const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');

// Add item to wishlist
router.post('/', async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // Validate request
        if (!userId || !productId) {
            return res.status(400).json({ message: 'User ID and Product ID are required' });
        }

        // Check if product already exists in the user's wishlist
        const existingWishlistItem = await Wishlist.findOne({ userId, productId });
        if (existingWishlistItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        // Add to wishlist
        const newWishlistItem = new Wishlist({ userId, productId });
        await newWishlistItem.save();

        res.status(201).json({ message: 'Item added to wishlist', wishlistItem: newWishlistItem });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Error adding to wishlist', error });
    }
});

// Get user's wishlist
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all wishlist items for the user and populate product details
        const wishlist = await Wishlist.find({ userId }).populate('productId');
        res.status(200).json({ wishlist });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ message: 'Error fetching wishlist', error });
    }
});

// Remove item from wishlist
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Remove the wishlist item
        const deletedItem = await Wishlist.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Wishlist item not found' });
        }

        res.status(200).json({ message: 'Item removed from wishlist', deletedItem });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ message: 'Error removing from wishlist', error });
    }
});

module.exports = router;