const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const purchaseHistorySchema = new Schema({
    user: { type: String, required: true }, // User ID
    products: [
        {
            productId: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
        },
    ], // Array of products in a single purchase
    status: { 
        type: String, 
        enum: ['reserved', 'confirmed'], 
        default: 'reserved',
    },
    purchaseDate: { type: Date, default: Date.now },
    invoice: { type: Buffer }, // PDF Invoice
    invoiceContentType: { type: String, enum: ['application/pdf'] },
}, { timestamps: true });

module.exports = model('PurchaseHistory', purchaseHistorySchema);
