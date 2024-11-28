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
  console.log("userid: " ,User.userId );
  try {
      const user = await User.findOne({ username }).select('+password');
      if (!user) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Merge session-based cart with user-based cart
      if (sessionId) {
          const sessionCart = await Cart.findOne({ sessionId });
          if (sessionCart) {
              const userCart = await Cart.findOne({ userId: user.userId });
              if (userCart) {
                  // Merge the carts
                  sessionCart.items.forEach((item) => {
                      const existingItem = userCart.items.find(
                          (cartItem) => cartItem.productId.toString() === item.productId.toString()
                      );
                      if (existingItem) {
                          existingItem.quantity += item.quantity;
                      } else {
                          userCart.items.push(item);
                      }
                  });
                  await userCart.save();
                  await sessionCart.deleteOne(); // Remove the session-based cart
              } else {
                  sessionCart.userId = user.userId;
                  sessionCart.sessionId = null; // Clear sessionId
                  await sessionCart.save();
              }
          }
      }

      res.status(200).json({ userId: user.userId });
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

