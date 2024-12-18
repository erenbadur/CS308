const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Cart = require('../models/cartModel');
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
    const newUser = new User({ username, email, password});
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
          //console.log("invalid credentials beacuse of user"); for debugging
          return res.status(400).json({ message: 'Invalid credentials' });
      }
      //console.log("invalid credentials because of match"); for debugging
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      let userCart = await Cart.findOne({ userId: user.userId });

      console.log("merging carts");
      if (sessionId) {
          const guestCart = await Cart.findOne({ sessionId, userId: null });
          if (guestCart) {
              if (!userCart) {
                  userCart = guestCart;
                  userCart.userId = user.userId;
                  userCart.sessionId = null;
                  await userCart.save();
                  //await guestCart.deleteOne();
                  console.log("created new cart for the user and merged it with guest cart");
              } else {
                  // Merge guestCart into userCart
                  console.log("user cart already exists, merging user and guest carts");
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
          role: user.role,
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
