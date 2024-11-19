const express = require('express');
const router = express.Router();
const Product = require('./models/product'); // Adjust the path for your product model
const stringSimilarity = require('string-similarity'); // Install with npm install string-similarity

router.get('/search', async (req, res) => {
    const { term, category } = req.query;

    try {
        // Validate the search term
        if (!term || term.trim() === '') {
            return res.status(400).json({ error: 'Search term is required.' });
        }

        // Build the initial query
        const query = category ? { category: category } : {};

        // Fetch matching products
        const products = await Product.find(query).limit(100); // Limit initial results for performance

        // Calculate edit distance and filter results
        const filteredProducts = products
            .map(product => {
                const fieldsToCompare = [product.name, product.description, product.model].filter(Boolean);
                const bestMatch = stringSimilarity.findBestMatch(term, fieldsToCompare);
                return { product, similarity: bestMatch.bestMatch.rating };
            })
            .filter(item => item.similarity > 0.5) // Filter by similarity threshold (e.g., 50%)
            .sort((a, b) => b.similarity - a.similarity); // Sort by similarity score

        if (filteredProducts.length > 0) {
            // Respond with matched results
            return res.status(200).json({
                message: 'Search successful',
                results: filteredProducts.map(item => item.product),
            });
        }

        // Fallback: Fetch relevant products
        const fallbackQuery = category
            ? { category } // Suggest products from the same category
            : {}; // Suggest trending or popular products

        const fallbackProducts = await Product.find(fallbackQuery)
            .sort({ popularity: -1 }) // Sort by popularity or other relevance criteria
            .limit(10); // Limit fallback results

        return res.status(200).json({
            message: 'No exact matches found. Showing relevant products.',
            results: fallbackProducts,
            fallback: true, // Indicate fallback logic
        });
    } catch (error) {
        console.error('Error during search with fallback:', error);
        res.status(500).json({ error: 'An error occurred during the search.' });
    }
});

module.exports = router;
