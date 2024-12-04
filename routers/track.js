const express = require('express');
const router = express.Router();
const PurchaseHistory = require('../models/PurchaseHistory'); // Adjust path to your model
const Product = require('../models/product'); // Adjust path to your model
const Delivery = require('../models/delivery')
router.get('/track/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const latestOrder = await PurchaseHistory.findOne({ user: userId })
        .sort({ createdAt: -1 }) // Sort by creation date in descending order
        .lean();
  
      if (!latestOrder) {
        return res.status(404).json({ message: 'No orders found for this user.' });
      }
  
      const delivery = await Delivery.findOne({ purchase: latestOrder._id }).lean();
  
      const enrichedOrder = {
        ...latestOrder,
        status: delivery ? delivery.status : 'Processing',
      };
  
      res.status(200).json({ order: enrichedOrder });
    } catch (error) {
      console.error('Error fetching latest order:', error);
      res.status(500).json({ error: 'An error occurred while fetching the latest order.' });
    }
  });
  





module.exports = router;
