const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const stringSimilarity = require('string-similarity');

const mongoose = require('mongoose');
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
};


router.get('/search', async (req, res) => {
    const { term, category, sortBy = 'popularity', order = 'desc', page = 1, limit = 10 } = req.query;

    try {
        if (!term && !category) {
            return res.status(400).json({ error: 'Either search term or category is required.' });
        }

        const query = {};
        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                query.category = category;
            } else {
                return res.status(400).json({ error: 'Invalid category ID.' });
            }
        }

        if (term) {
            const escapedTerm = escapeRegex(term); // Escape special characters in the search term
            const regex = new RegExp(escapedTerm, 'i'); // Case-insensitive regex
            query.$or = [{ name: regex }, { description: regex }];
        }

        // Sorting and pagination
        const sortOrder = order === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;

        // Fetch matching products
        const totalResults = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit));

        const totalPages = Math.ceil(totalResults / limit);

        return res.status(200).json({
            message: 'Search successful',
            results: products,
            totalResults,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (error) {
        console.error('Error during search:', error.message);
        res.status(500).json({ error: 'An error occurred during the search.', details: error.message });
    }
});




module.exports = router;
