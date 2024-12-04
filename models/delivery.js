const mongoose = require('mongoose');
const deliverySchema = new mongoose.Schema({
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseHistory", required: true },
    user: { type: String, required: true },
    products: [
        {
            productId: { type: String, required: true },
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
        },
    ],
    deliveryAddress: {
        fullName: { type: String, required: true },
        phoneNum: { type: String, required: true },
        address: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
    }, // Address as an object
    status: {
        type: String,
        enum: ["processing", "in-transit", "delivered"],
        default: "processing",
    },
});

module.exports = mongoose.model("Delivery", deliverySchema);
