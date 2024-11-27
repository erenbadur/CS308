const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const stringSimilarity = require('string-similarity');

router.get('/search', async (req, res) => {
    const { term, category } = req.query;

    try {
        if (!term && !category) {
            console.log("Error: Empty search term and category");
            return res.status(400).json({ error: 'Either search term or category is required.' });
        }

        // Build query
        const query = {};
        if (category) query.category = category;

        if (term) {
            const regex = new RegExp(term, 'i'); // Case-insensitive regex
            if (category) {
                // Combine category and search term conditions
                query.$and = [
                    { category },
                    { $or: [{ name: regex }, { description: regex }] },
                ];
            } else {
                // Search term only
                query.$or = [{ name: regex }, { description: regex }];
            }
        }

        console.log("MongoDB Query:", JSON.stringify(query));

        // Fetch matching products
        const products = await Product.find(query).limit(100);
        console.log("Fetched Products:", products.length);

        // Fuzzy matching logic
        let filteredProducts = [];
        if (term) {
            filteredProducts = products
                .map((product) => {
                    const fieldsToCompare = [product.name, product.description].filter(Boolean);
                    const bestMatch = stringSimilarity.findBestMatch(term, fieldsToCompare);
                    console.log(`Product: ${product.name}, Similarity: ${bestMatch.bestMatch.rating}`);
                    return { product, similarity: bestMatch.bestMatch.rating };
                })
                .sort((a, b) => b.similarity - a.similarity); // Sort by similarity score

            // Keep all products for fallback but tag them with similarity scores
            const similarityThreshold = 0.2; // Adjust threshold based on testing
            const exactMatches = filteredProducts.filter((item) => item.similarity >= similarityThreshold);
            const lowSimilarityMatches = filteredProducts.filter((item) => item.similarity < similarityThreshold);

            console.log("Exact Matches:", exactMatches.length);

            if (exactMatches.length > 0) {
                return res.status(200).json({
                    message: 'Search successful',
                    results: exactMatches.map((item) => item.product),
                    fallback: false,
                });
            }

            if (lowSimilarityMatches.length > 0) {
                return res.status(200).json({
                    message: 'No high-relevance matches. Showing lower-relevance results.',
                    results: lowSimilarityMatches.map((item) => item.product),
                    fallback: true,
                });
            }
        }

        // Fallback: Suggest popular products in the category or globally
        console.log("No matches. Fetching fallback products...");
        const fallbackQuery = category ? { category } : {};
        const fallbackProducts = await Product.find(fallbackQuery)
            .sort({ popularity: -1 })
            .limit(3); // Limit fallback results

        return res.status(200).json({
            message: 'No exact matches found. Showing relevant fallback products.',
            results: fallbackProducts,
            fallback: true,
        });
    } catch (error) {
        console.error('Error during search:', error.message);
        res.status(500).json({ error: 'An error occurred during the search.', details: error.message });
    }
});



module.exports = router;
