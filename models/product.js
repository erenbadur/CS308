const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const commentSchema = new Schema({
    user: { type: String, required: true }, // Use custom userId (String)
    content: { type: String, required: true, maxlength: 500 }, // Comment text, max length 500
    approved: { type: Boolean, default: false }, // Indicates if the comment is approved
    createdAt: { type: Date, default: Date.now }, // Automatically sets the creation date
    approved: { type: Boolean, default: false } // New field
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
    name: { type: String, required: true, trim: true }, // Product name
    model: { type: String, required: true, unique: true }, // Unique model identifier
    serialNumber: { type: String, required: true, unique: true }, // Unique serial number
    description: { type: String, trim: true }, // Optional description
    category: {
        type: String,
        required: true, // Makes the category mandatory
        enum: ['mobile phone', 'computer', 'tablet', 'accessories', 'headphone','smartwatch','television','camera'], // Define allowed categories
        default: 'accessory', // Default value if not specified
    },
    quantityInStock: { type: Number, required: true, min: 0, default: 100 }, // Stock quantity cannot go below 0
    price: { type: Number, required: true, min: 0 }, // Price of the product
    warrantyStatus: { type: Boolean, default: true }, // Indicates if the product is under warranty
    distributor: { type: String, required: true }, // Distributor information
    ratings: [
        {
            user: { type: String, required: true }, // Use custom userId (String) instead of ObjectId
            rating: { type: Number, required: true, min: 1, max: 5 },
        },
    ],
    
    averageRating: { type: Number, default: 0 }, // Automatically calculated average rating
    comments: [commentSchema], // Array of comments
    popularity: { type: Number, default: 0 }, // Popularity score (optional)
    discount: {
        percentage: { type: Number, min: 0, max: 100, default: 0 }, // Discount percentage
        validUntil: { type: Date } // Expiration date for the discount
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

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


productSchema.index({ name: 'text', description: 'text', model: 'text' });

const Product = model('Product', productSchema);
module.exports = Product;
