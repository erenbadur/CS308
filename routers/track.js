const express = require('express');
const router = express.Router();
const PurchaseHistory = require('../models/PurchaseHistory'); // Adjust path to your model
const Product = require('../models/product'); // Adjust path to your model
const Delivery = require('../models/delivery')

router.get('/track/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch orders for the user from PurchaseHistory
        const orders = await PurchaseHistory.find({ user: userId });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this user.' });
        }

        // Fetch product details and delivery statuses
        const productDetails = {};
        const formattedOrders = [];

        for (const order of orders) {
            // Fetch product details
            if (!productDetails[order.product]) {
                const product = await Product.findOne({ productId: order.product });
                productDetails[order.product] = product ? product.name : 'Unknown Product';
            }

            // Fetch delivery status
            const delivery = await Delivery.findOne({ purchase: order._id });

            // Format the order
            formattedOrders.push({
                _id: order._id,
                product: { name: productDetails[order.product] },
                quantity: order.quantity,
                status: delivery ? delivery.status : 'Processing', // Default to 'Processing' if no delivery found
                createdAt: order.createdAt,
                invoice: order.status === 'confirmed' && order.invoice ? order.invoice.toString('base64') : null,
                invoiceContentType: order.invoiceContentType || null,
            });
        }

        res.status(200).json({ orders: formattedOrders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'An error occurred while fetching orders.' });
    }
});

module.exports = router;
