const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Import Product model
const PurchaseHistory = require('../models/PurchaseHistory');

// Middleware to check if the user purchased the product
const canCommentOrRate = async (req, res, next) => {
    const { userId, productId } = req.body;
    try {
        const purchase = await PurchaseHistory.findOne({ user: userId, product: productId });
        if (!purchase) {
            return res.status(403).json({ error: 'You can only comment or rate products you have purchased.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during validation.' });
    }
};

// Add a comment
router.post('/:productId/comment', canCommentOrRate, async (req, res) => {
    const { productId } = req.params;
    const { userId, content } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        product.comments.push({ user: userId, content });
        await product.save();
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while adding the comment' });
    }
});

// Add a rating
router.post('/:productId/rate', canCommentOrRate, async (req, res) => {
    const { productId } = req.params;
    const { userId, rating } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        product.ratings.push({ user: userId, rating });
        await product.save();
        res.status(201).json({ message: 'Rating added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while adding the rating' });
    }
});

router.get('/', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; 
      const limit = parseInt(req.query.limit) || 12; 
  
      const startIndex = (page - 1) * limit;
  
      const totalProducts = await Product.countDocuments();
  
      const products = await Product.find()
        .skip(startIndex)
        .limit(limit);
  
      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        pageSize: limit,
        totalProducts: totalProducts,
        hasPrevPage: page > 1,
        hasNextPage: page < Math.ceil(totalProducts / limit),
      };
  
      res.json({
        products,
        pagination,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  });
module.exports = router;
