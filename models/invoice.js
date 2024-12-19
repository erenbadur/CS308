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
    delivery: {
        deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
        totalPrice: { type: Number }, // Total price of delivery
        status: { type: String, enum: ["processing", "in-transit", "delivered"], default: "processing" }, // Delivery status
        address: {
            fullName: { type: String },
            phoneNum: { type: String },
            address: { type: String },
            country: { type: String },
            postalCode: { type: String },
        },
    },
    date: { type: Date, default: Date.now },
    invoiceFilePath: { type: String, required: true },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
