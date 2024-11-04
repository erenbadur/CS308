const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // To hash passwords
const express = require('express');
const listEndpoints = require('express-list-endpoints'); // For listing routes

const app = express();

// Define the User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: [true, 'Username is required'],  // Field validation
        unique: true,  // Ensure username is unique
        minlength: [3, 'Username must be at least 3 characters'], 
        maxlength: [30, 'Username cannot exceed 30 characters'] 
    },
    email: { 
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Invalid email'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        select: false // Exclude password from query results by default to ensure security
    },
    isAdmin: {
        type: Boolean,
        default: false  // Regular user status
    },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }] // Reference to Order documents
});

// Password hashing before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); // Only hash if password is new or changed
    try {
        const salt = await bcrypt.genSalt(10); // Generate salt
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
        next();
    } catch (error) {
        next(error);
    }
});

// Export the User Model
const User = mongoose.model('User', userSchema);
module.exports.User = User;

// Define Comment Subschema
const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
    content: { type: String, required: true, maxlength: 500 }, // Comment content
    approved: { type: Boolean, default: false }, // Approved by product manager
    createdAt: { type: Date, default: Date.now } // Timestamp of comment creation
});

// Define Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true }, // Product name
    model: { type: String, required: true, unique: true }, // Unique model number
    serialNumber: { type: String, required: true, unique: true }, // Unique serial number
    description: { type: String, trim: true }, // Product description
    quantityInStock: { type: Number, required: true, min: 0 }, // Stock quantity
    price: { type: Number, required: true, min: 0 }, // Product price
    warrantyStatus: { type: Boolean, default: true }, // Warranty status
    distributor: { type: String, required: true }, // Distributor information

    ratings: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
            rating: { type: Number, required: true, min: 1, max: 10 } // Rating value (1-10)
        }
    ],

    averageRating: { type: Number, default: 0 }, // Calculated average rating
    comments: [commentSchema], // Array of comments (requires approval)

    popularity: { type: Number, default: 0 }, // Track product popularity for sorting

    discount: {
        percentage: { type: Number, min: 0, max: 100, default: 0 }, // Discount percentage
        validUntil: { type: Date } // Discount expiration date
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Pre-save Hook to Calculate Average Rating
productSchema.pre('save', function (next) {
    if (this.ratings.length > 0) {
        const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
        this.averageRating = sum / this.ratings.length;
    }
    next();
});

// Export the Product Model
const Product = mongoose.model('Product', productSchema);
module.exports.Product = Product;

// Initialize Express and List Endpoints
app.get('/test', (req, res) => res.send('Test endpoint'));

// Log all endpoints (add this line at the bottom to see all routes)
console.log(listEndpoints(app));

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
