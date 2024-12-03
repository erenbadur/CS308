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

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { username, password, sessionId } = req.body;

  try {
      const user = await User.findOne({ username }).select('+password');
      if (!user) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      let userCart = await Cart.findOne({ userId: user.userId });
      if (sessionId) {
          const guestCart = await Cart.findOne({ sessionId });
          if (guestCart) {
              if (!userCart) {
                  userCart = guestCart;
                  userCart.userId = user.userId;
                  userCart.sessionId = null;
                  await userCart.save();
              } else {
                  // Merge guestCart into userCart
                  guestCart.items.forEach((guestItem) => {
                      const existingItem = userCart.items.find(
                          (item) => item.productId === guestItem.productId
                      );
                      if (existingItem) {
                          existingItem.quantity += guestItem.quantity;
                      } else {
                          userCart.items.push(guestItem);
                      }
                  });
                  await userCart.save();
                  await guestCart.deleteOne();
              }
          }
      }

      res.status(200).json({
          userId: user.userId,
          cart: userCart ? userCart.items : [],
          message: 'Login successful',
      });
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
