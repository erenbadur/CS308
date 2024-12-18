const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Adjust path for User model

// Create a new user with a specific role
router.post('/user', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Fields username, email, and password are required.',
            });
        }

        // Validate role
        const allowedRoles = ['user', 'salesManager', 'productManager'];
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({
                error: `Invalid role. Allowed roles are: ${allowedRoles.join(', ')}.`,
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
            role: role || 'user', // Default role is 'user' if not provided
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
