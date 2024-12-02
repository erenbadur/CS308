const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Import Product model
const PurchaseHistory = require('../models/PurchaseHistory');
const User = require('../models/user'); // Import Product model
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

// Add a comment to a product
router.post('/:productId/comment', canCommentOrRate, async (req, res) => {
    const { productId } = req.params;
    const { userId, content } = req.body;

    try {
        // Find the product
        const product = await Product.findOne({ productId });
        if (!product) return res.status(404).json({ error: 'Product not found.' });

        // Fetch the username from the User model
        const user = await user.findOne( { userId });
        const username = user?.username || 'Anonymous'; // Fallback to "Anonymous" if user not found

        // Add the comment with username and timestamp
        product.comments.push({
            user: userId,
            username: username || 'Anonymous', // Use provided username or default to Anonymous
            content,
            createdAt: new Date(), // Add current timestamp
        });
        await product.save();

        res.status(201).json({ message: 'Comment added successfully.' });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'An error occurred while adding the comment.' });
    }
});


router.get('/:productId/comments', async (req, res) => {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; // Default to 5 comments per page

    try {
        // Find product and validate existence
        const product = await Product.findOne({ productId });
        if (!product) return res.status(404).json({ error: 'Product not found.' });

        // Paginate comments
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const totalComments = product.comments.length;

        const paginatedComments = product.comments.slice(startIndex, endIndex);

        // Enrich comments with username and format response
        const comments = await Promise.all(
            paginatedComments.map(async (comment) => {
                const user = await User.findOne({ userId: comment.user }); // Fetch username using userId

              return {
                username: user?.username || 'Anonymous',
                content: comment.content,
                date: comment.createdAt || new Date(),
              };
            })
          );
      
        res.status(200).json({
            comments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalComments / limit),
                totalComments,
            },
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'An error occurred while fetching comments.' });
    }
});


router.post('/:productId/rate', canCommentOrRate, async (req, res) => {
    const { productId } = req.params;
    const { userId, rating } = req.body;

    try {
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Add the rating
        product.ratings.push({ user: userId, rating });

        // Recalculate average rating
        const totalRatings = product.ratings.reduce((sum, r) => sum + r.rating, 0);
        product.averageRating = totalRatings / product.ratings.length;

        await product.save();
        res.status(201).json({ message: 'Rating added successfully.', averageRating: product.averageRating });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while adding the rating.' });
    }
});


// Get paginated list of products
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
      res.status(500).json({ message: 'Server Error' });
  }
});

// Sorting products by price or popularity
router.get('/sort', async (req, res) => {
    const { sortBy = 'price', order = 'asc', page = 1, limit = 9 } = req.query;

    const validSortFields = ['price', 'popularity', 'averageRating'];
    if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ error: 'Invalid sort field.' });
    }

    try {
        const sortOrder = order === 'asc' ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find({})
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit));

        const totalProducts = await Product.countDocuments();

        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalProducts / parseInt(limit)),
            pageSize: parseInt(limit),
            totalProducts: totalProducts,
            hasPrevPage: parseInt(page) > 1,
            hasNextPage: parseInt(page) < Math.ceil(totalProducts / parseInt(limit)),
        };

        res.status(200).json({ products, pagination });
    } catch (error) {
        console.error('Error sorting products:', error);
        res.status(500).json({ error: 'Sorting failed.' });
    }
});


router.get('/:productId', async (req, res) => {
    const { productId } = req.params; // Extract productId from the URL

    console.log(`[API] Fetching product details for productId: ${productId}`); // Log for debugging

    try {
        // Find the product by productId or _id (depending on your schema)
        const product = await Product.findOne({ productId }); // Adjust field as per schema

        // If the product doesn't exist
        if (!product) {
            console.warn(`[API] Product with ID ${productId} not found.`);
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Return the product details
        console.log(`[API] Found product:`, {
            productId: product.productId,
            name: product.name,
            quantityInStock: product.quantityInStock,
        });

        res.status(200).json({
            productId: product.productId,
            name: product.name,
            price: product.price,
            quantityInStock: product.quantityInStock,
        });
    } catch (error) {
        console.error(`[API] Error fetching product with ID ${productId}:`, error);
        res.status(500).json({ error: 'An error occurred while fetching the product.' });
    }
});


module.exports = router;
