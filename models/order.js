const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const orderSchema = new Schema({
    user: { type: String, required: true }, // Reference to the User
    sessionId: { type: String }, // For guest users
    // added this to use it for order tracking
    purchaseId: { type: String, required: true }, // Unique ID for a single purchase transaction
    product: { type: String, ref: 'Product', required: true }, // Reference to the Product
    quantity: { type: Number, required: true, min: 1 }, // Quantity ordered
    status: { type: String, enum: ['Processing', 'In-Transit', 'Delivered'], default: 'Processing' }, // Order status
    createdAt: { type: Date, default: Date.now }, // Order creation date
},{ timestamps: true });

const Order = model('Order', orderSchema);
module.exports = Order;
