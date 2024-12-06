const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/user');

// Mock middleware to inject user ID for testing
router.use((req, res, next) => {
  req.user = { id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') }; // Use a valid ObjectId
  next();
});

// GET: Fetch the last 5 notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id; // Retrieve mock user ID
    const user = await User.findById(userId, 'notifications');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = user.notifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
});

// POST: Mark all notifications as read
router.post('/mark-read', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notifications.forEach((notification) => {
      notification.isRead = true;
    });

    await user.save();
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error in POST /api/notifications/mark-read:', error);
    res.status(500).json({ message: 'Error marking notifications as read', error });
  }
});

// POST: Add a new notification
router.post('/new', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newNotification = {
      id: new Date().getTime().toString(),
      message,
      timestamp: new Date(),
      isRead: false,
    };

    user.notifications.unshift(newNotification);
    await user.save();
    res.status(201).json({ message: 'Notification added', notification: newNotification });
  } catch (error) {
    console.error('Error in POST /api/notifications/new:', error);
    res.status(500).json({ message: 'Error adding notification', error });
  }
});

module.exports = router;