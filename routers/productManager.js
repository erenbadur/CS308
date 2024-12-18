const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const PurchaseHistory = require('../models/PurchaseHistory');
const Category = require('../models/category');
const User = require('../models/user');
const Order = require('../models/order');
const Delivery = require('../models/delivery'); // Ensure this is correctly defined

// GET /categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'An error occurred while fetching categories.' });
    }
});

// POST /categories (Add category)
router.post('/categories', async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Category name is required and must be a non-empty string.' });
    }

    try {
        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category already exists.' });
        }

        const newCategory = new Category({ name: name.trim() });
        await newCategory.save();

        res.status(201).json({ message: 'Category added successfully.', category: newCategory });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'An error occurred while adding the category.' });
    }
});

// DELETE /categories/:categoryName (Delete category and its products)
router.delete('/categories/:categoryName', async (req, res) => {
    const { categoryName } = req.params;

    try {
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            return res.status(404).json({ error: 'Category not found.' });
        }
        const deletedProducts = await Product.deleteMany({ category: category._id });

        await Category.deleteOne({ _id: category._id });

        res.status(200).json({
            message: `Category "${categoryName}" and its associated products have been deleted successfully.`,
            deletedProductsCount: deletedProducts.deletedCount
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'An error occurred while deleting the category.' });
    }
});

// GET /manager/products - List all products, with optional category filter
router.get('/products', async (req, res) => {
    try {
        const { category } = req.query; // category is category ObjectId

        let query = {};
        if (category) {
            query.category = category;
        }

        const products = await Product.find(query).populate('category');
        res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'An error occurred while fetching products.' });
    }
});

// DELETE /manager/products/:productId - Delete a product by productId
router.delete('/products/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await Product.findOneAndDelete({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.status(200).json({ message: 'Product deleted successfully.', product });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'An error occurred while deleting the product.' });
    }
});

// Decrease stock for a product
router.put('/product/decrease-stock', async (req, res) => {
    const { productId, quantityToRemove } = req.body;

    try {
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        if (product.quantityInStock < quantityToRemove) {
            return res.status(400).json({ error: 'Insufficient stock.' });
        }
        product.quantityInStock -= quantityToRemove;
        await product.save();
        res.status(200).json({ message: 'Stock decreased successfully.', product });
    } catch (error) {
        console.error('Error decreasing stock:', error);
        res.status(500).json({ error: 'An error occurred while decreasing stock.' });
    }
});

// PUT /manager/products/:productId - Update product details (excluding discount)
router.put('/products/:productId', async (req, res) => {
    const { productId } = req.params;
    const updateFields = { ...req.body };

    // Remove discount fields if present
    delete updateFields.discount;
    delete updateFields.discountPercentage;
    delete updateFields.discountValidUntil;

    try {
        // Validate if category is being updated and exists
        if (updateFields.category) {
            const categoryExists = await Category.findById(updateFields.category);
            if (!categoryExists) {
                return res.status(400).json({ error: 'Selected category does not exist.' });
            }
        }

        // Update the product
        const updatedProduct = await Product.findOneAndUpdate(
            { productId },
            { $set: updateFields },
            { new: true, runValidators: true }
        ).populate('category');

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.status(200).json({ message: 'Product updated successfully.', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'An error occurred while updating the product.' });
    }
});


router.put('/product/increase-stock', async (req, res) => {
    const { productId, quantityToAdd } = req.body;

    if (!productId || !quantityToAdd || quantityToAdd <= 0) {
        return res.status(400).json({ error: 'Invalid productId or quantity.' });
    }

    try {
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        product.quantityInStock += quantityToAdd; // Increase stock
        await product.save();

        res.status(200).json({
            message: 'Stock increased successfully.',
            product: {
                productId: product.productId,
                updatedStock: product.quantityInStock,
            },
        });
    } catch (error) {
        console.error('Error increasing stock:', error);
        res.status(500).json({ error: 'An error occurred while increasing stock.' });
    }
});


// Fetch all invoices
router.get('/invoices', async (req, res) => {
    try {
        const invoices = await PurchaseHistory.find().populate('product user');
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'An error occurred while fetching invoices.' });
    }
});

// Update comment approval
router.put('/:productId/:commentId', async (req, res) => {
    const { productId, commentId } = req.params;
    const { approved } = req.body;

    try {
        // Find the product containing the comment
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Find the specific comment within the product's comments array
        const comment = product.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        // Update the comment's approval status
        comment.approved = approved;
        await product.save();

        res.status(200).json({ message: 'Comment updated successfully.', comment });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'An error occurred while updating the comment.' });
    }
});


// Update delivery status
router.patch('/deliveries/:deliveryId', async (req, res) => {
    const { deliveryId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Processing', 'In-Transit', 'Delivered'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}.` });
    }

    try {
        const order = await Order.findById(deliveryId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }
        order.status = status;
        await order.save();
        res.status(200).json({ message: 'Delivery status updated successfully.', order });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ error: 'An error occurred while updating delivery status.' });
    }
});

// Get pending deliveries
router.get('/deliveries/pending', async (req, res) => {
    try {
        const pendingOrders = await Order.find({ status: { $ne: 'Delivered' } }).populate('product user');
        res.status(200).json({ pendingOrders });
    } catch (error) {
        console.error('Error fetching pending deliveries:', error);
        res.status(500).json({ error: 'An error occurred while fetching pending deliveries.' });
    }
});


router.post('/order/process', async (req, res) => {
    const { productId, quantity, userId } = req.body;

    try {
        // Validate input
        if (!productId || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Invalid productId or quantity.' });
        }

        // Find product
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Check stock
        if (product.quantityInStock < quantity) {
            return res.status(400).json({ error: 'Not enough stock.' });
        }

        // Deduct stock
        product.quantityInStock -= quantity;
        await product.save();

        // Create order
        const order = new Order({
            user: userId,
            product: productId,
            quantity,
            status: 'Processing',
        });
        await order.save();

        res.status(200).json({
            message: 'Order processed successfully.',
            order,
        });
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ error: 'An error occurred while processing the order.' });
    }
});


router.patch('/delivery/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        order.status = status;
        await order.save();

        res.status(200).json({ message: 'Delivery status updated.', order });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ error: 'An error occurred while updating delivery status.' });
    }
});


module.exports = router;