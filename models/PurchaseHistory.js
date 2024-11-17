const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const purchaseHistorySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to the Product
    quantity: { type: Number, required: true, min: 1 }, // Quantity of the product purchased
    purchaseDate: { type: Date, default: Date.now } // Date of purchase
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

const PurchaseHistory = model('PurchaseHistory', purchaseHistorySchema);

module.exports = PurchaseHistory;
