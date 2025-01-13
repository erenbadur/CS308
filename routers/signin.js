const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Cart = require('../models/cartModel');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Sign-Up Route
router.post(
  '/signin',
  [
    body('username').trim().notEmpty().withMessage('Username is required').escape(),
    body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();

      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required').escape(),
    body('password').trim().notEmpty().withMessage('Password is required').escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
        const guestCart = await Cart.findOne({ sessionId, userId: null });
        if (guestCart) {
          if (!userCart) {
            userCart = guestCart;
            userCart.userId = user.userId;
            userCart.sessionId = null;
            await userCart.save();
          } else {
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
  }
);




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
