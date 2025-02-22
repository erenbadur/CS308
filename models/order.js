const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const orderSchema = new Schema({
    user: { type: String, required: true }, // Reference to the User
    sessionId: { type: String }, // For guest users
    product: { type: String, ref: 'Product', required: true }, // Reference to the Product
    quantity: { type: Number, required: true, min: 1 }, // Quantity ordered
    status: { type: String, enum: ['Processing', 'In-Transit', 'Delivered'], default: 'Processing' }, // Order status
    createdAt: { type: Date, default: Date.now }, // Order creation date
    status: { type: String, default: 'Processing' }, // Default status
},{ timestamps: true });

const Order = model('Order', orderSchema);
module.exports = Order;
