const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const PurchaseHistory = require('../models/PurchaseHistory');
const User = require('../models/user');
const Order = require('../models/order');
const Delivery = require('../models/delivery'); // Ensure this is correctly defined

// Remove a product
router.delete('/product/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const deletedProduct = await Product.findOneAndDelete({ productId });
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product removed successfully.', product: deletedProduct });
    } catch (error) {
        console.error('Error removing product:', error);
        res.status(500).json({ error: 'An error occurred while removing the product.' });
    }
});

// Add a new category (fix Category handling logic)
router.post('/categories', async (req, res) => {
    const { category } = req.body;

    try {
        // Simulating category addition logic (use your actual implementation)
        // If categories are part of the Product schema, this may require schema updates
        res.status(200).json({ message: `Category "${category}" added successfully.` });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'An error occurred while adding the category.' });
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