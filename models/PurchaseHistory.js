const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const purchaseHistorySchema = new Schema({
    user: { type: String, required: true }, // Custom userId instead of ObjectId
    product: { type: String, required: true }, // Custom productId instead of ObjectId
    quantity: { type: Number, required: true, min: 1 }, // Quantity purchased
    purchaseDate: { type: Date, default: Date.now }, // Date of purchase
    invoice: { type: Buffer }, // Binary data for the invoice (optional)
    invoiceContentType: { type: String, enum: ['application/pdf'] }, // File type for the invoice
}, { timestamps: true });

module.exports = model('PurchaseHistory', purchaseHistorySchema);
