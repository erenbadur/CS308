const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const invoiceSchema = new Schema({
    invoiceId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `INV-${new mongoose.Types.ObjectId()}`;
        },
    },
    user: { type: String, required: true },
    email: { type: String, required: true },
    products: [
        {
            productId: { type: String, required: true }, // Unique identifier for the product
            name: { type: String, required: true },
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            total: { type: Number, required: true },
        },
    ],
    totalAmount: { type: Number, default: 0 }, // Total invoice amount
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' }, // Reference to Delivery
    date: { type: Date, default: Date.now },
    invoiceFilePath: { type: String, required: true },
    invoiceHash: { type: String, required: true }, // New field for hash
});

// Pre-save hook to calculate `totalAmount`
invoiceSchema.pre('save', function (next) {
    this.totalAmount = this.products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    next();
});

module.exports = model('Invoice', invoiceSchema);
