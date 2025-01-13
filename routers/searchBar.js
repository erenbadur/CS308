const express = require('express');
const { query, validationResult } = require('express-validator');
const router = express.Router();
const Product = require('../models/product');
const mongoose = require('mongoose');

// Utility function to escape special characters
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
};

// Search Route with Input Validation
router.get(
    '/search',
    [
        query('term')
            .optional()
            .trim()
            .escape()
            .isString()
            .withMessage('Search term must be a valid string.'),
        query('category')
            .optional()
            .custom((value) => mongoose.Types.ObjectId.isValid(value))
            .withMessage('Invalid category ID.'),
        query('sortBy')
            .optional()
            .isIn(['popularity', 'price', 'rating'])
            .withMessage('Invalid sort field.'),
        query('order')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Order must be "asc" or "desc".'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer.'),
        query('limit')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Limit must be a positive integer.'),
    ],
    async (req, res) => {
        // Handle validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { term, category, sortBy = 'popularity', order = 'desc', page = 1, limit = 10 } = req.query;

        try {
            // Build query object
            const query = {};
            if (category) {
                query.category = category;
            }

            if (term) {
                const escapedTerm = escapeRegex(term);
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
    }
);

module.exports = router;
