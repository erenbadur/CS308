const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const refundRequestSchema = new Schema({
    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseHistory',
        required: true, // Link to the purchase history
    },
    deliveryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
        required: true, // Link to the delivery history
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true, // Link to the purchase history
    },
    productId: {
        type: String,
        required: true, // The product being returned
    },
    quantity: {
        type: Number,
        required: true, // Quantity of the product being requested for refund
    },
    requestedAt: {
        type: Date,
        default: Date.now, // Timestamp when the refund request was made
    },
    refundAmount: {
        type: Number,
        required: true, // Amount to be refunded
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending', // The current status of the refund request
    },
    reason: {
        type: String,
        trim: true, // Reason for the refund request (optional)
    },
    userId: {
        type: String,
        required: true, // Customer making the refund request
    },
}, { timestamps: true });

// Method to calculate the refund amount
refundRequestSchema.methods.calculateRefundAmount = async function() {
    const purchaseHistory = await mongoose.model('PurchaseHistory').findById(this.purchaseHistoryId).populate('products');
    const product = purchaseHistory.products.find(p => p.productId === this.productId);

    if (!product) {
        throw new Error('Product not found in the purchase history.');
    }

    const productDetails = await mongoose.model('Product').findOne({ productId: this.productId });

    // Calculate the refund amount
    let refundAmount = product.price * this.quantity;

    // If the product was bought during a discount campaign, adjust the refund
    if (productDetails.discount && productDetails.discount.percentage > 0) {
        refundAmount = refundAmount * (1 - productDetails.discount.percentage / 100);
    }

    this.refundAmount = refundAmount.toFixed(2);
    await this.save();
};

// Method to process the refund
refundRequestSchema.methods.processRefund = async function() {
    if (this.status !== 'approved') {
        throw new Error('Refund request is not approved.');
    }

    const product = await mongoose.model('Product').findOne({ productId: this.productId });
    if (!product) {
        throw new Error('Product not found.');
    }

    // Increase the stock of the product
    await product.increaseStock(this.quantity, 'refund', this.customerId);

    // Send the refund email (you can implement this with your email service)
    const sendEmail = require('./emailService'); // Adjust path as needed
    const productName = product.name;
    const emailSubject = `Your Refund for ${productName} has been Processed`;
    const emailText = `Dear Customer,\n\nYour refund of ${this.refundAmount} for ${productName} has been processed successfully. Thank you for shopping with us!`;
    await sendEmail(this.customerId, emailSubject, emailText, emailText); // Adjust the email sending logic accordingly

    return { message: 'Refund processed successfully', refundedAmount: this.refundAmount };
};

module.exports = model('Refund', refundRequestSchema);
