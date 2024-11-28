const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const orderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User
    sessionId: { type: String }, // For guest users
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to the Product
    quantity: { type: Number, required: true, min: 1 }, // Quantity ordered
    status: { type: String, enum: ['Processing', 'In-Transit', 'Delivered'], default: 'Processing' }, // Order status
    createdAt: { type: Date, default: Date.now }, // Order creation date
},{ timestamps: true });

const Order = model('Order', orderSchema);
module.exports = Order;
