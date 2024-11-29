const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    productId: { type: String, required: true }, // Custom productId as string
    quantity: { type: Number, required: true, min: 1 },
});

const cartSchema = new Schema({
    userId: { type: String, required: false }, // Optional for logged-in users
    sessionId: { type: String, required: function () { return !this.userId; } }, // Required if no userId
    items: [cartItemSchema], // Array of cart items
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cart', cartSchema);
