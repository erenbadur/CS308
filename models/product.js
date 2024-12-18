const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const commentSchema = new Schema({
    user: { type: String, required: true }, // Use custom userId (String)
    content: { type: String, required: true, maxlength: 500 }, // Comment text, max length 500
    approved: { type: Boolean, default: false }, // Indicates if the comment is approved
    createdAt: { type: Date, default: Date.now }, // Automatically sets the creation date
    //approved: { type: Boolean, default: false } // New field
});

const productSchema = new Schema({
    productId: {
        type: String,
        required: true,
        unique: true,
        default: function () {
            return `PROD-${new mongoose.Types.ObjectId()}`; // Generate unique product ID
        },
    },
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true, unique: true },
    serialNumber: { type: String, required: true, unique: true },
    description: { type: String, trim: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    imageUrl: { type: String, required: true },
    quantityInStock: { type: Number, required: true, min: 0, default: 100 },
    price: { type: Number, required: true, min: 0 },
    warrantyStatus: { type: Boolean, default: true },
    distributor: { type: String, required: true },
    ratings: [
        {
            user: { type: String, required: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
        },
    ],
    averageRating: { type: Number, default: 0 },
    comments: [commentSchema],
    popularity: { type: Number, default: 0 },
    discount: {
        percentage: { type: Number, min: 0, max: 100, default: 0 },
        validUntil: { type: Date },
        purchasesDuringDiscount: { type: Number, default: 0 }, // Number of purchases made during discounts
    },
    refundable: { type: Boolean, default: true }, // Indicates if the product is eligible for returns
    totalRefunded: { type: Number, default: 0 }, // Total quantity refunded
}, { timestamps: true });

productSchema.pre('save', function (next) {
    if (this.ratings.length > 0) {
        const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0); // Sum all ratings
        this.averageRating = sum / this.ratings.length; // Calculate average
    }
    next(); // Proceed with saving
});

productSchema.methods.decreaseStock = async function (quantity) {
    const updatedProduct = await Product.findOneAndUpdate(
        { productId: this.productId, quantityInStock: { $gte: quantity } },
        { $inc: { quantityInStock: -quantity } },
        { new: true }
    );

    if (!updatedProduct) {
        throw new Error('Not enough items in stock.');
    }

    return updatedProduct;
};

productSchema.methods.increaseStock = async function (quantity) {
    const updatedProduct = await Product.findOneAndUpdate(
        { productId: this.productId },
        { $inc: { quantityInStock: quantity, totalRefunded: quantity } },
        { new: true }
    );

    return updatedProduct;
};

productSchema.index({ name: 'text', description: 'text', model: 'text' });

const Product = model('Product', productSchema);
module.exports = Product;
