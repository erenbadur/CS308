const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const deliverySchema = new Schema({
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseHistory', required: true },
    user: { type: String, required: true },
    products: [
        {
            productId: { type: String, required: true },
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
        },
    ],
    deliveryAddress: {
        fullName: { type: String, required: true },
        phoneNum: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
    },
    status: {
        type: String,
        enum: ['processing', 'in-transit', 'delivered'],
        default: 'processing',
    },
    totalPrice: { type: Number, default: 0 }, // Total delivery price
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice', // Reference to Invoice model
    },
}, { timestamps: true });

// Pre-save hook to calculate `totalPrice`
deliverySchema.pre('save', function (next) {
    this.totalPrice = this.products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    next();
});

module.exports = model('Delivery', deliverySchema);
