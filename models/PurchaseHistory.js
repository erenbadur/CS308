const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const purchaseHistorySchema = new Schema(
    {
        user: { type: String, required: true }, // User ID
        products: [
            {
                productId: { type: String, required: true },
                name: { type: String, required: true },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true },
                refundable: { 
                    type: String, 
                    enum: ['no_return', 'return_req', 'approved', 'rejected'],
                    default: 'no_return',
                },
            },
        ],
        totalQuantity: { type: Number, default: 0 }, // Calculated field
        totalRevenue: { type: Number, default: 0 }, // Calculated field
        delivery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Delivery', // Reference to Delivery model
        },
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice', // Reference to Invoice model
        },
        status: {
            type: String,
            enum: ['reserved', 'confirmed', 'shipped', 'delivered'],
            default: 'reserved',
        },
        purchaseDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Pre-save hook to calculate `totalQuantity` and `totalRevenue`
purchaseHistorySchema.pre('save', function (next) {
    this.totalQuantity = this.products.reduce((sum, p) => sum + p.quantity, 0);
    this.totalRevenue = this.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    next();
});

module.exports = model('PurchaseHistory', purchaseHistorySchema);
