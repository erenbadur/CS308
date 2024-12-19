const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const PurchaseHistory = require('../models/PurchaseHistory');
const Category = require('../models/category');
const User = require('../models/user');
const Order = require('../models/order');
const Delivery = require('../models/delivery'); // Ensure this is correctly defined
const Invoice = require('../models/invoice');
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

router.get('/comments', async (req, res) => {
    const { approved, sortBy = 'createdAt', order = 'desc' } = req.query;

    try {
      
        const products = await Product.find().populate('category');

     
        let allComments = [];
        products.forEach(product => {
            product.comments.forEach(comment => {
                allComments.push({
                    productId: product.productId,
                    productName: product.name,
                    commentId: comment._id,
                    user: comment.user,
                    content: comment.content,
                    approved: comment.approved,
                    createdAt: comment.createdAt,
                });
            });
        });

        
        if (approved !== undefined) {
            const isApproved = approved === 'true';
            allComments = allComments.filter(comment => comment.approved === isApproved);
        }

      
        allComments.sort((a, b) => {
            if (order === 'asc') {
                return new Date(a[sortBy]) - new Date(b[sortBy]);
            } else {
                return new Date(b[sortBy]) - new Date(a[sortBy]);
            }
        });

        res.status(200).json({ comments: allComments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'An error occurred while fetching comments.' });
    }
});

// PUT /manager/comments/:productId/:commentId/approve
router.put('/comments/:productId/:commentId/approve', async (req, res) => {
    const { productId, commentId } = req.params;

    try {
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const comment = product.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        comment.approved = true;
        await product.save();

        res.status(200).json({ message: 'Comment approved successfully.', comment });
    } catch (error) {
        console.error('Error approving comment:', error);
        res.status(500).json({ error: 'An error occurred while approving the comment.' });
    }
});

// PUT /manager/comments/:productId/:commentId/disapprove
router.put('/comments/:productId/:commentId/disapprove', async (req, res) => {
    const { productId, commentId } = req.params;

    try {
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const comment = product.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        comment.approved = false;
        await product.save();

        res.status(200).json({ message: 'Comment disapproved successfully.', comment });
    } catch (error) {
        console.error('Error disapproving comment:', error);
        res.status(500).json({ error: 'An error occurred while disapproving the comment.' });
    }
});

// DELETE /manager/comments/:productId/:commentId
router.delete('/comments/:productId/:commentId', async (req, res) => {
    const { productId, commentId } = req.params;

    try {
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const comment = product.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        comment.remove();
        await product.save();

        res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'An error occurred while deleting the comment.' });
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

// ====================== Delivery Management ======================

// GET /manager/deliveries
router.get('/deliveries', async (req, res) => {
    const { sortBy = 'purchaseDate', order = 'desc' } = req.query;

    try {
        const deliveries = await PurchaseHistory.find()
            .populate('delivery')
            .populate('user')
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

        const deliveriesWithInvoices = await Promise.all(deliveries.map(async (purchase) => {
            const invoice = await Invoice.findOne({ user: purchase.user, delivery: purchase.delivery });
            return {
                deliveryId: purchase.delivery ? purchase.delivery._id : 'N/A',
                customerId: purchase.user,
                productId: purchase.products.map(p => p.productId).join(', '),
                quantity: purchase.products.reduce((total, p) => total + p.quantity, 0),
                totalPrice: purchase.totalRevenue,
                deliveryAddress: purchase.delivery ? purchase.delivery.deliveryAddress : 'N/A',
                deliveryStatus: purchase.delivery ? purchase.delivery.status : 'N/A',
                purchaseDate: purchase.purchaseDate,
                invoiceId: invoice ? invoice.invoiceId : 'N/A',
                invoiceDate: invoice ? invoice.date : 'N/A',
                invoiceTotalAmount: invoice ? invoice.totalAmount : 'N/A',
            };
        }));

        res.status(200).json({ deliveries: deliveriesWithInvoices });
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        res.status(500).json({ error: 'An error occurred while fetching deliveries.' });
    }
});

// GET /manager/deliveries/:deliveryId
router.get('/deliveries/:deliveryId', async (req, res) => {
    const { deliveryId } = req.params;

    try {
        const delivery = await Delivery.findById(deliveryId)
            .populate('purchase')
            .populate('user');

        if (!delivery) {
            return res.status(404).json({ error: 'Delivery not found.' });
        }

        const invoice = await Invoice.findOne({ delivery: delivery._id });

        res.status(200).json({
            deliveryId: delivery._id,
            customerId: delivery.user,
            productId: delivery.products.map(p => p.productId).join(', '),
            quantity: delivery.products.reduce((total, p) => total + p.quantity, 0),
            totalPrice: delivery.totalPrice,
            deliveryAddress: delivery.deliveryAddress,
            deliveryStatus: delivery.status,
            purchaseDate: delivery.purchase.purchaseDate,
            invoiceId: invoice ? invoice.invoiceId : 'N/A',
            invoiceDate: invoice ? invoice.date : 'N/A',
            invoiceTotalAmount: invoice ? invoice.totalAmount : 'N/A',
        });
    } catch (error) {
        console.error('Error fetching delivery details:', error);
        res.status(500).json({ error: 'An error occurred while fetching delivery details.' });
    }
});




module.exports = router;