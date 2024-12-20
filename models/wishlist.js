const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    userId: {
        type: String, // Changed to string
        required: true,
    },
    productId: {
        type: String, // Changed to string
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Wishlist', WishlistSchema);
