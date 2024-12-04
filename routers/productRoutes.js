const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Import Product model
const PurchaseHistory = require('../models/PurchaseHistory');
const User = require('../models/user'); // Import Product model
// Middleware to check if the user purchased the product
const canCommentOrRate = async (req, res, next) => {
    const { userId } = req.body;
    const { productId } = req.params;

    if (!userId || !productId) {
        return res.status(400).json({ error: 'User ID and Product ID are required.' });
    }

    try {
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
router.post('/:productId/comment', async (req, res) => {
// Submit a rating or a comment for a product
    const { productId } = req.params;
    const { userId, rating, content } = req.body;

    try {
        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'A valid rating (1-5) is required.' });
        }

        // Validate content length (if provided)
        if (content && content.length > 500) {
            return res.status(400).json({ error: 'Comment content exceeds the maximum length of 500 characters.' });
        }

        // Find the product
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Add the rating to the product
        product.ratings.push({ user: userId, rating });

        // Only add a comment if content is provided
        if (content) {
            product.comments.push({
                user: userId,
                content,
                approved: false, // Default to false; needs admin approval
            });
        }

        // Save the updated product
        await product.save();

        res.status(201).json({ message: 'Rating and/or comment submitted successfully.' });
    } catch (error) {
        console.error('Error submitting rating/comment:', error);
        res.status(500).json({ error: 'An error occurred while submitting your rating/comment.' });
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

router.get('/sort', async (req, res) => {
    const { sortBy = 'price', order = 'asc', page = 1, limit = 9, category, term } = req.query;

    const sortOrder = order === 'asc' ? 1 : -1; // Determine sort order
    const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate the number of documents to skip

    try {
        // Build the query object
        const query = {};
        if (category) query.category = category; // Filter by category if provided
        if (term) {
            query.$or = [
                { name: { $regex: term, $options: 'i' } }, // Match term in name
                { description: { $regex: term, $options: 'i' } }, // Match term in description
            ];
        }

        // Fetch sorted and paginated products
        const products = await Product.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit));

        const totalProducts = await Product.countDocuments(query); // Total filtered products

        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalProducts / parseInt(limit)),
            pageSize: parseInt(limit),
            totalProducts,
            hasPrevPage: parseInt(page) > 1,
            hasNextPage: parseInt(page) < Math.ceil(totalProducts / parseInt(limit)),
        };

        res.status(200).json({ products, pagination });
    } catch (error) {
        console.error('Error during sorting:', error);
        res.status(500).json({ error: 'Sorting failed.' });
    }
});

router.get('/:productId/comments', async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Filter approved comments
        const approvedComments = product.comments.filter(comment => comment.approved);

        // Fetch user details for each comment
        const commentsWithUsernames = await Promise.all(
            approvedComments.map(async (comment) => {
                const user = await User.findOne({ userId: comment.user }); // Fetch user details
                return {
                    ...comment.toObject(),
                    username: user ? user.name : 'Anonymous',
                    createdAt: comment.createdAt, // Already available in the schema
                };
            })
        );

        res.status(200).json({ comments: commentsWithUsernames });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'An error occurred while fetching comments.' });
    }
});


router.get('/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        console.log(`[API] Fetching product with ID: ${productId}`);
        
        const product = await Product.findOne({ productId });
        if (!product) {
            console.warn(`[API] Product not found: ${productId}`);
            return res.status(404).json({ error: 'Product not found.' });
        }

        console.log(`[API] Product found:`, {
            productId: product.productId,
            quantityInStock: product.quantityInStock,
        });

        res.status(200).json({ product });
    } catch (error) {
        console.error('[API] Error fetching product:', error);
        res.status(500).json({ error: 'An error occurred while fetching the product.' });
    }
});



module.exports = router;
