const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
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



router.post('/login', async (req, res) => {
  const { username, password, sessionId } = req.body;

  try {
    // 1. Find the user by username
    const user = await User.findOne({ username }).select('+password'); // Ensure password is selected
    if (!user) {
      return res.status(400).json({ message: 'Username is incorrect' });
    }

    // 2. Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Username or password is incorrect' });
    }

    // 3. Login successful: Update or create a cart associated with the user
    if (sessionId) {
      // Find the cart associated with the sessionId and update it with userId
      await Cart.updateOne(
        { sessionId },
        { userId: user._id },
        { upsert: true } // If no cart exists for this sessionId, create one
      );
    }

    // 4. Send a response with the userId and a success message
    res.status(200).json({
      message: 'Welcome',
      userId: user._id,
      username: user.username,
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

