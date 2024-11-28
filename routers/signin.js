const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Cart = require('../models/cartModel');
const router = express.Router();

// Function to merge guest and user carts
const mergeCarts = async (sessionId, userId) => {
  try {
      // Find both carts
      const guestCart = await Cart.findOne({ sessionId });
      let userCart = await Cart.findOne({ userId });

      if (guestCart) {
          if (!userCart) {
              // If user cart does not exist, create it with guest items
              userCart = new Cart({
                  userId,
                  items: guestCart.items,
              });
          } else {
              // Merge items into user cart
              guestCart.items.forEach((guestItem) => {
                  const existingItem = userCart.items.find(
                      (item) => item.productId === guestItem.productId
                  );
                  if (existingItem) {
                      // If item already exists in user cart, increase the quantity
                      existingItem.quantity += guestItem.quantity;
                  } else {
                      // Otherwise, add the new item
                      userCart.items.push(guestItem);
                  }
              });
          }

          // Save the merged cart
          await userCart.save();

          // Delete the guest cart after merging
          await Cart.deleteOne({ sessionId });
      }
  } catch (error) {
      console.error('Error merging carts:', error);
      throw error;
    }
};

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

    // 3. Handle cart merging for logged-in users
    if (sessionId) {
      // Fetch the session-based cart
      const sessionCart = await Cart.findOne({ sessionId });

      // Fetch or create the user's cart
      let userCart = await Cart.findOne({ userId: user._id });
      if (!userCart) {
        userCart = new Cart({ userId: user._id, items: [] });
      }

      // Merge session-based cart items into the user's cart
      if (sessionCart) {
        sessionCart.items.forEach((sessionItem) => {
          const existingItem = userCart.items.find(
            (userItem) => userItem.productId.toString() === sessionItem.productId.toString()
          );

          if (existingItem) {
            // Increment the quantity if the item already exists in the user's cart
            existingItem.quantity += sessionItem.quantity;
          } else {
            // Add new item to the user's cart
            userCart.items.push(sessionItem);
          }
        });

        // Save the updated user cart and delete the session cart
        await userCart.save();
        await sessionCart.deleteOne();
      }
    }

    // 4. Send a response with the userId and a success message
    res.status(200).json({
      message: 'Welcome',
      userId: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
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

