const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Adjust path for User model

// Create a new user
router.post('/user', async (req, res) => {
    const { username, email, password, isAdmin } = req.body;

    try {
        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Fields username, email, and password are required.',
            });
        }

        // Check if the username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }],
        });
        if (existingUser) {
            return res.status(400).json({
                error: 'Username or email already exists.',
            });
        }

        // Create the new user
        const newUser = new User({
            username,
            email,
            password, // Password will be hashed by the `pre` middleware in the User model
            isAdmin: isAdmin || false, // Default to false if not provided
        });

        // Save the user to the database
        await newUser.save();

        // Exclude sensitive information (e.g., password) from the response
        const { password: _, ...userWithoutPassword } = newUser.toObject();

        res.status(201).json({
            message: 'User created successfully.',
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            error: 'An error occurred while creating the user.',
        });
    }
});

module.exports = router;
