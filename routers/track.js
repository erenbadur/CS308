const express = require('express');
const router = express.Router();
const Invoice = require('../models/invoice'); // Adjust the path to the Invoice model
const path = require('path');
const fs = require('fs');
const Delivery = require('../models/delivery'); // Adjust the path to the Invoice model
const PurchaseHistory = require('../models/PurchaseHistory'); // Adjust the path to the Invoice model
const sendEmail = require('./email');
const User = require('../models/user');


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
                    deliveryId: delivery._id,
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

router.patch('/cancel-order', async (req, res) => {
  const {deliveryId, orderId} = req.body;
    try {
        console.log('--- /cancel-order Debug Start ---');
        console.log('Processing cancellation for deliveryId:', deliveryId);

        // Find the delivery and populate product details
        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
            console.error('Delivery not found:', deliveryId);
            return res.status(404).json({ error: 'Delivery not found.' });
        }

        // Check if order is in 'processing' status
        if (delivery.status !== 'processing') {
            console.error(`Cannot cancel delivery. Current status: ${delivery.status}`);
            return res.status(400).json({
                error: 'Only orders in processing status can be cancelled.'
            });
        }

        // Update order status to cancelled
        delivery.status = 'cancelled';
        await delivery.save();

        // Find the order and populate product details
        const order = await PurchaseHistory.findById(orderId);
        if (!order) {
            console.error('Order not found:', orderId);
            return res.status(404).json({ error: 'Order not found.' });
        }
        const user = await User.findOne({userId: delivery.user});
        if (!user) {
          console.error('User not found:', delivery.user);
          return res.status(404).json({ error: 'User not found.' });
      }

        // Calculate total refund amount
      const refundAmount = delivery.totalPrice

      const productsList = delivery.products
      .map(product => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${product.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.quantity}</td>
        </tr>
      `).join('');
    
      const emailSubject = `Refund Processed for Order: ${delivery.purchase}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Dear ${delivery.user},</p>
          
          <p>Your refund has been successfully processed for the following items:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
            </tbody>
          </table>
    
          <p><strong>Total Refunded Amount:</strong> $${refundAmount}</p>
          <p>Thank you for shopping with us!</p>
        </div>
      `;
    
      const emailText = `
        Dear ${delivery.user},
        
        Your refund has been successfully processed for the following items:
        
        ${delivery.products.map(p => `- ${p.name} (Quantity: ${p.quantity})`).join('\n')}
        
        Total Refunded Amount: $${refundAmount}
        
        Thank you for shopping with us!
          `;

        console.log('Sending refund confirmation email...');
        await sendEmail(user.email, emailSubject, emailText, emailHtml);
        console.log('Refund confirmation email sent successfully.');

        console.log('--- /cancel-order Debug End ---');
        return res.status(200).json({
            message: 'Order cancelled successfully',
            orderId: order._id,
            refundAmount: refundAmount
        });

    } catch (error) {
        console.error('Error cancelling order:', error.message);
        return res.status(500).json({ error: 'Failed to cancel order.' });
    }
});
module.exports = router;