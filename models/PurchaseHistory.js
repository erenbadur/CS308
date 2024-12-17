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
    ],
    status: { 
        type: String, 
        enum: ['reserved', 'confirmed'], 
        default: 'reserved',
    },
    purchaseDate: { type: Date, default: Date.now },
    totalRevenue: { type: Number }, // Total revenue (calculated as sum of product prices * quantities)
    totalProfit: { type: Number }, // Total profit (calculated based on cost price and selling price)
}, { timestamps: true });

module.exports = model('PurchaseHistory', purchaseHistorySchema);

