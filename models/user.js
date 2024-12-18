const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // To hash passwords

// Define the User Schema
const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true, // Ensure userID is unique
        default: function () {
            return `USER-${new mongoose.Types.ObjectId()}`; // Generate unique userID
        },
    },
    username: {
        type: String,
        required: [true, 'Username is required'], // Field validation
        unique: true, // Ensure username is unique
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
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
        select: false, // Exclude password from query results by default to ensure security
    },
    role: {
        type: String,
        enum: ['customer', 'salesManager', 'productManager'], // Allow only specific roles
        default: 'customer', // Default role for new users
    },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // Reference to Order documents

    notifications: [
        {
          id: String, // Unique identifier for the notification
          message: String, // Notification text
          timestamp: Date, // Time when the notification was created
          isRead: Boolean, // Whether the user has read this notification
        }
      ],
});

// Password hashing before saving
userSchema.pre('save', async function (next) {
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
module.exports = User;