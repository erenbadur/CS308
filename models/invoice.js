const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `INV-${new mongoose.Types.ObjectId()}`;
        },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    products: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            total: { type: Number, required: true },
        },
    ],
    totalAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    invoiceFilePath: { type: String, required: true }, // Path to the saved invoice PDF
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
