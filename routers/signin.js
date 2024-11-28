const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Cart = require('../models/cartModel');
const { v4: uuidv4 } = require('uuid'); // Import uuidv4
const router = express.Router();

// Sign-Up Route
router.post('/signin', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Login Route
router.post('/login', async (req, res) => {
  let { username, password, sessionId } = req.body;

  try {
      // Auto-generate sessionId if not provided
      if (!sessionId) {
          sessionId = uuidv4(); // Generate a new sessionId
      }

      // Find the user by username
      const user = await User.findOne({ username }).select('+password');
      if (!user) {
          return res.status(400).json({ message: 'Username or password is incorrect' });
      }

      // Compare the provided password with the hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Username or password is incorrect' });
      }

      // Link the session-based cart to the logged-in user
      const sessionCart = await Cart.findOne({ sessionId });
      if (sessionCart) {
          sessionCart.userId = user._id;
          await sessionCart.save();
      }

      // Respond with user details and the sessionId
      res.status(200).json({
          message: 'Login successful',
          userId: user._id,
          username: user.username,
          sessionId, // Return the session ID to the frontend
      });
  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Server error' });
  }
});




  // Get All Users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Fetch all users without passwords
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});






module.exports = router;

