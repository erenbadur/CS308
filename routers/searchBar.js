const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const stringSimilarity = require('string-similarity');

const mongoose = require('mongoose');

router.get('/search', async (req, res) => {
    const { term, category, sortBy = 'popularity', order = 'desc', page = 1, limit = 10 } = req.query;

    try {
        const query = {};

        // Check if the category is provided
        if (category) {
            // Try to find the category by name if it's not an ObjectId
            if (!mongoose.Types.ObjectId.isValid(category)) {
                const categoryDoc = await Category.findOne({ name: category });
                if (categoryDoc) {
                    query.category = categoryDoc._id; // Use the ObjectId of the category
                } else {
                    return res.status(404).json({ error: 'Category not found.' });
                }
            } else {
                query.category = category; // Use the provided ObjectId
            }
        }

        if (term) {
            const regex = new RegExp(term, 'i'); // Case-insensitive regex
            query.$or = [{ name: regex }, { description: regex }];
        }

        const sortOrder = order === 'asc' ? 1 : -1;
        const skip = (page - 1) * limit;

        const totalResults = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit));

        const totalPages = Math.ceil(totalResults / limit);

        res.status(200).json({
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
