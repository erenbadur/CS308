const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseHistory', required: true },
    user: { type: String, required: true },
    product: { type: String, required: true },
    quantity: { type: Number, required: true },
    deliveryAddress: {
        fullName: { type: String, required: true },
        phoneNum: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
    },
    status: { type: String, enum: ['processing', 'in-transit', 'delivered'], default: 'processing' },
}, { timestamps: true });

const Delivery = mongoose.model('Delivery', deliverySchema);
module.exports = Delivery;
