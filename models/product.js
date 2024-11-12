const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const commentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User who made the comment
    content: { type: String, required: true, maxlength: 500 }, // Comment text, max length 500
    approved: { type: Boolean, default: false }, // Indicates if the comment is approved
    createdAt: { type: Date, default: Date.now } // Automatically sets the creation date
    // IMPORTANT: Ensure in backend logic that the user can only comment if they have purchased the product
});

const productSchema = new Schema({
    name: { type: String, required: true, trim: true }, // Product name
    model: { type: String, required: true, unique: true }, // Unique model identifier
    serialNumber: { type: String, required: true, unique: true }, // Unique serial number
    description: { type: String, trim: true }, // Optional description
    quantityInStock: { type: Number, required: true, min: 0 }, // Stock quantity cannot go below 0
    price: { type: Number, required: true, min: 0 }, // Price of the product
    warrantyStatus: { type: Boolean, default: true }, // Indicates if the product is under warranty
    distributor: { type: String, required: true }, // Distributor information
    ratings: [{
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User who gave the rating
        rating: { type: Number, required: true, min: 1, max: 5 } // Rating between 1 and 5
    }],
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

productSchema.methods.decreaseStock = function (quantity) {
    if (this.quantityInStock - quantity < 0) { // Check if there is enough stock
        throw new Error('Not enough items in stock.'); // Throw an error if insufficient
    }
    this.quantityInStock -= quantity; // Reduce stock
    return this.save(); // Save the updated product
};

const Product = model('Product', productSchema);
module.exports = Product;