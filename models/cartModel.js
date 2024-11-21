const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
});

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // Optional for guest users
    sessionId: { type: String, required: true }, // Session ID for guests
    items: [cartItemSchema], // Array of cart items
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Cart', cartSchema);

