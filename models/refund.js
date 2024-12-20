const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema({
    refundId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `REFUND-${new mongoose.Types.ObjectId()}`;
        },
    },
    userId: {
        type: String,
        required: true,
    },
    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseHistory',
        required: true,
    },
    productId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    reason: {
        type: String,
        maxlength: 500,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Refund', RefundSchema);
