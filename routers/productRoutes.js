const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Import Product model
const PurchaseHistory = require('../models/PurchaseHistory');


// Middleware to check if the user purchased the product
const canCommentOrRate = async (req, res, next) => {
  const { userId } = req.body; // Extract userId from the request body
  const { productId } = req.params; // Extract productId from the URL

  console.log('Validating userId:', userId);
  console.log('Validating productId:', productId);

  try {
      // Use the custom productId and userId for the query
      const purchase = await PurchaseHistory.findOne({ user: userId, product: productId });
      if (!purchase) {
          return res.status(403).json({ error: 'You can only comment or rate products you have purchased.' });
      }
      next();
  } catch (error) {
      console.error('Error during validation:', error);
      res.status(500).json({ error: 'An error occurred during validation.' });
  }
};


router.post('/:productId/comment', canCommentOrRate, async (req, res) => {
  const { productId } = req.params; // Extract productId from the URL
  const { userId, content } = req.body; // Extract userId and content from the body

  try {
      // Find the product using productId
      const product = await Product.findOne({ productId });
      if (!product) return res.status(404).json({ error: 'Product not found.' });

      // Add the comment
      product.comments.push({ user: userId, content });
      await product.save();

      res.status(201).json({ message: 'Comment added successfully.' });
  } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'An error occurred while adding the comment.' });
  }
});

router.post('/:productId/rate', canCommentOrRate, async (req, res) => {
  const { productId } = req.params; // Extract productId from the URL
  const { userId, rating } = req.body; // Extract userId and rating from the body

  try {
      // Validate the rating value
      if (rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
      }

      // Find the product using the custom productId
      const product = await Product.findOne({ productId });
      if (!product) {
          return res.status(404).json({ error: 'Product not found.' });
      }

      // Check if the user has already rated this product
      const existingRating = product.ratings.find((r) => r.user === userId);
      if (existingRating) {
          return res.status(400).json({ error: 'You have already rated this product.' });
      }

      // Add the rating
      product.ratings.push({ user: userId, rating });

      // Recalculate the average rating
      const totalRatings = product.ratings.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating = totalRatings / product.ratings.length;

      // Save the updated product
      await product.save();

      res.status(201).json({
          message: 'Rating added successfully.',
          averageRating: product.averageRating,
      });
  } catch (error) {
      console.error('Error adding rating:', error);
      res.status(500).json({ error: 'An error occurred while adding the rating.' });
  }
});




router.get('/', async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const category = req.query.category;

      const startIndex = (page - 1) * limit;

      let query = {};
      if (category) {
          query.category = category;
      }

      const totalProducts = await Product.countDocuments(query);

      const products = await Product.find(query)
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
      res.status(500).json({ message: 'Sunucu hatası' });
  }
});

