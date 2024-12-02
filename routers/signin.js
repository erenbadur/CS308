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

router.post('/login', async (req, res) => {
  const { username, password, sessionId } = req.body;

  console.log('Login request received:', { username, sessionId }); // Debug

  try {
      const user = await User.findOne({ username }).select('+password');
      if (!user) {
          console.warn('Login failed: User not found', { username });
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          console.warn('Login failed: Invalid password', { username });
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      console.log('User authenticated successfully:', { userId: user.userId, username });

      console.log('starting to merge carts'); // debug log
      // Handle cart merging
      if (sessionId) {
          console.log('Checking for session cart:', { sessionId });
          const sessionCart = await Cart.findOne({ sessionId });
          let userCart = await Cart.findOne({ userId: user.userId });

          if (sessionCart) {
              if (!userCart) {
                  console.log('Assigning session cart to user.');
                  sessionCart.userId = user.userId;
                  sessionCart.sessionId = sessionId;
                  await sessionCart.save();
              } else {
                  console.log('Merging session cart into user cart...');
                  userCart.sessionId = sessionId
                  sessionCart.items.forEach((sessionItem) => {
                      const existingItem = userCart.items.find(
                          (userItem) => userItem.productId === sessionItem.productId
                      );
                      if (existingItem) {
                          existingItem.quantity += sessionItem.quantity;
                      } else {
                          userCart.items.push(sessionItem);
                      }
                  });

                  await userCart.save();
                  await sessionCart.deleteOne();
              }
          }
          else{
            console.log("couldn't find the session cart"); // debug log
          }
          console.log('Merged Cart:', userCart);
      } else {
          console.log('No session cart provided.');
      }

      res.status(200).json({ userId: user.userId, message: 'Login successful' });
  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Internal server error' });
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

