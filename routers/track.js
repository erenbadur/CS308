const express = require('express');
const router = express.Router();
const Invoice = require('../models/invoice'); // Adjust the path to the Invoice model
const path = require('path');
const fs = require('fs');
const Delivery = require('../models/delivery'); // Adjust the path to the Invoice model
const PurchaseHistory = require('../models/PurchaseHistory'); // Adjust the path to the Invoice model

router.get('/download/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;

  try {
    // Step 1: Fetch the invoice from the database using the invoiceId
    const invoice = await Invoice.findOne({ invoiceId }).populate('delivery');
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    // Step 2: Validate the invoiceFilePath field
    if (!invoice.invoiceFilePath) {
      return res.status(400).json({ error: 'Invoice file path is missing in the database.' });
    }

    // Step 3: Resolve the full file path
    const filePath = path.resolve(invoice.invoiceFilePath);

    // Step 4: Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Invoice file not found on the server.' });
    }

    // Step 5: Trigger the download with a meaningful filename
    const fileName = `Invoice-${invoiceId}.pdf`;
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending the invoice file:', err.message);
        return res.status(500).json({ error: 'An error occurred while downloading the invoice file.' });
      }
    });
  } catch (error) {
    console.error('Error fetching invoice file:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching the invoice file.' });
  }
});

// Get the latest purchase for a specific user
router.get('/track/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
      // Fetch the latest purchase
      const latestPurchase = await PurchaseHistory.findOne({ user: userId })
          .sort({ purchaseDate: -1 }) // Sort by purchaseDate in descending order
          .populate({
            path: 'delivery',
            populate: { path: 'invoice' }, // Populate invoice within delivery
        })
        .populate('invoice') // Populate invoice directly from PurchaseHistory

      console.log('Fetched latestPurchase:', latestPurchase);

      if (!latestPurchase) {
          return res.status(404).json({ error: 'No recent purchase found for this user.' });
      }

      const delivery = latestPurchase.delivery || {};
      const invoice = latestPurchase.invoice || {};

      console.log('Delivery details:', delivery);
      console.log('Invoice details:', invoice);

      // Format the response
      const formattedOrder = {
        _id: latestPurchase._id,
        products: latestPurchase.products,
        status: latestPurchase.status,
        purchaseDate: latestPurchase.purchaseDate,
        deliveryDetails: delivery._id
          ? {
              status: delivery.status,
              deliveryAddress: delivery.deliveryAddress,
              totalPrice: delivery.totalPrice || 0,
            }
          : null,
        invoiceDetails: invoice._id
          ? {
              invoiceId: invoice.invoiceId,
              totalAmount: invoice.totalAmount,
              date: invoice.date,
            }
          : null,
      };
  

      res.status(200).json({ order: formattedOrder });
  } catch (error) {
      console.error('Error fetching latest purchase:', error.message);
      res.status(500).json({ error: 'An error occurred while fetching the latest purchase.' });
  }
});

// get all purchases for spesific user
router.get('/orders/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all orders for the user, sorted by purchaseDate in descending order
    const orders = await PurchaseHistory.find({ user: userId })
        .sort({ purchaseDate: -1 }) // Sort by purchaseDate in descending order
        .populate({
            path: 'delivery',
            populate: { path: 'invoice' }, // Populate invoice within delivery
        })
        .populate('invoice'); // Populate invoice directly from PurchaseHistory

    console.log('Fetched orders:', orders);

    if (!orders || orders.length === 0) {
        return res.status(404).json({ error: 'No orders found for this user.' });
    }

    // Format the response
    const formattedOrders = orders.map(order => {
        const delivery = order.delivery || {};
        const invoice = order.invoice || {};

        return {
            _id: order._id,
            products: order.products,
            status: order.status,
            purchaseDate: order.purchaseDate,
            deliveryDetails: delivery._id
                ? {
                    status: delivery.status,
                    deliveryAddress: delivery.deliveryAddress,
                    totalPrice: delivery.totalPrice || 0,
                }
                : null,
            invoiceDetails: invoice._id
                ? {
                    invoiceId: invoice.invoiceId,
                    totalAmount: invoice.totalAmount,
                    date: invoice.date,
                }
                : null,
        };
    });

    res.status(200).json({ orders: formattedOrders });
} catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching the orders.' });
}

});


module.exports = router;