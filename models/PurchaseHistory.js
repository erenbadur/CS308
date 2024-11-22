const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const purchaseHistorySchema = new Schema({
    user: { type: String, required: true }, // Use custom userId instead of ObjectId
    product: { type: String, required: true }, // Use custom productId instead of ObjectId
    quantity: { type: Number, required: true, min: 1 }, // Quantity purchased
    purchaseDate: { type: Date, default: Date.now }, // Purchase date
}, { timestamps: true });

module.exports = model('PurchaseHistory', purchaseHistorySchema);
