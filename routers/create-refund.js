const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Invoice = require('../models/invoice');
const Delivery = require('../models/delivery');
const RefundRequest = require('../models/refund');  // Assuming the RefundRequest model is stored here
const PurchaseHistory = require('../models/PurchaseHistory'); 
const User = require('../models/user'); 
const mongoose = require('mongoose'); // Ensure mongoose is imported

router.post('/create-refund-request', async (req, res) => {
    const { deliveryId, productId, quantity, userId } = req.body;

    console.log('--- /create-refund-request Start ---');
    console.log('Request Body:', req.body);

    try {
        // Validate that deliveryId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
            console.error(`Invalid deliveryId format: ${deliveryId}`);
            return res.status(400).json({ error: 'Invalid deliveryId format.' });
        }

        // Check if delivery exists and product is part of the delivery
        const delivery = await Delivery.findOne({ _id: deliveryId, 'products.productId': productId }).populate('purchase');
        if (!delivery) {
            console.error(`Delivery not found for deliveryId: ${deliveryId}, productId: ${productId}`);
            return res.status(404).json({ error: 'Delivery not found for the specified product.' });
        }

        // Check if the delivery status is 'delivered'
        if (delivery.status !== 'delivered') {
            console.error(`Delivery not completed for deliveryId: ${deliveryId}`);
            return res.status(400).json({ error: 'Refund is only allowed after delivery is completed.' });
        }

        console.log('Delivery found:', delivery);

        // Find the invoice associated with this deliveryId and productId
        const invoice = await Invoice.findOne({ delivery: deliveryId, 'products.productId': productId });
        if (!invoice) {
            console.error(`Invoice not found for deliveryId: ${deliveryId}, productId: ${productId}`);
            return res.status(404).json({ error: 'Invoice not found for this delivery.' });
        }

        console.log('Invoice found:', invoice);

        // Check if the product quantity is valid for a refund
        const productDetails = invoice.products.find(p => p.productId.toString() === productId.toString());
        if (!productDetails || productDetails.quantity < quantity) {
            console.error(`Invalid quantity for refund. Available quantity: ${productDetails ? productDetails.quantity : 0}`);
            return res.status(400).json({ error: 'Invalid quantity for refund request.' });
        }

        // Calculate the refund amount considering the product's price and quantity
        const product = await Product.findOne({ productId });
        if (!product) {
            console.error(`Product not found for productId: ${productId}`);
            return res.status(404).json({ error: 'Product not found.' });
        }

        const discountPercentage = product.discount ? product.discount.percentage : 0;
        const discountPrice = productDetails.price * (1 - discountPercentage / 100);
        const refundAmount = (discountPrice * quantity).toFixed(2);

        console.log(`Calculated refundAmount: $${refundAmount}`);

        // Fetch the purchaseId from the delivery's purchase reference
        const purchaseId = delivery.purchase ? delivery.purchase._id : null;
        if (!purchaseId) {
            console.error('Purchase ID not found in delivery.');
            return res.status(404).json({ error: 'Purchase ID not found in delivery.' });
        }

        // Create a new refund request, including the `deliveryId` and `purchaseId`
        const refundRequest = new RefundRequest({
            deliveryId: deliveryId,
            invoiceId: invoice._id, // Set invoiceId from the fetched invoice
            purchaseId: purchaseId, // Set purchaseId from the delivery's purchase
            productId,
            quantity,
            status: 'pending',
            refundAmount: parseFloat(refundAmount),
            userId,
        });

        console.log('RefundRequest Object:', refundRequest);

        // Save the refund request to the database
        await refundRequest.save();

        console.log('Refund request created successfully:', refundRequest);

        // Send the success response
        res.status(200).json({
            message: 'Refund request created successfully.',
            refundRequest,
        });

        console.log('--- /create-refund-request End ---');
    } catch (error) {
        console.error('Error creating refund request:', error.message);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create refund request.' });
    }
});

module.exports = router;