const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const commentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
    approved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const productSchema = new Schema({
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true, unique: true },
    serialNumber: { type: String, required: true, unique: true },
    description: { type: String, trim: true },
    quantityInStock: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    warrantyStatus: { type: Boolean, default: true },
    distributor: { type: String, required: true },
    ratings: [{ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, rating: { type: Number, required: true, min: 1, max: 10 } }],
    averageRating: { type: Number, default: 0 },
    comments: [commentSchema],
    popularity: { type: Number, default: 0 },
    discount: { percentage: { type: Number, min: 0, max: 100, default: 0 }, validUntil: { type: Date } }
}, { timestamps: true });

productSchema.pre('save', function (next) {
    if (this.ratings.length > 0) {
        const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
        this.averageRating = sum / this.ratings.length;
    }
    next();
});

const Product = model('Product', productSchema);
module.exports = Product;
