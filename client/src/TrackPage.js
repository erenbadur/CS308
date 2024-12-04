import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TrackPage.css';

const TrackPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Function to clear the cart
  const clearCart = async () => {
    const sessionId = localStorage.getItem('sessionId');
    const userId = localStorage.getItem('user');

    try {
      await axios.delete('/api/cart/clear', { params: { sessionId, userId } });
      console.log('Cart cleared successfully.');
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  // Handle "Back to Main Page" button
  const handleBackToMain = async () => {
    await clearCart(); // Clear the cart
    navigate('/'); // Navigate to the main page
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem('user'); // Retrieve user ID from localStorage
        if (!userId) {
          setError('User not found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/track/track/${userId}`);
        setOrders(response.data.orders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch orders immediately
    fetchOrders();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrders, 10000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  if (loading) {
    return <div className="track-page-loading">Loading your orders...</div>;
  }

  if (error) {
    return <div className="track-page-error">{error}</div>;
  }

  return (
    <div className="track-page">
      <h1>Track Your Orders</h1>
      {orders.length === 0 ? (
        <p>No recent orders found.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <h2>Order ID: {order._id}</h2>
              <p><strong>Product:</strong> {order.product?.name || 'Unknown Product'}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p><strong>Status:</strong> {order.status}</p>

              {/* Display status-specific messages */}
              {order.status === 'processing' && (
                <p className="processing-message">
                  Your order is being processed. Please wait for confirmation.
                </p>
              )}

              {order.status === 'in-transit' && (
                <p className="in-transit-message">
                  Your order is on the way! Check back for delivery updates.
                </p>
              )}

              {order.status === 'delivered' && (
                <p className="delivered-message">
                  Your order has been delivered. Thank you for shopping with us!
                </p>
              )}

              {order.invoice && (
                <div className="invoice">
                  <p>Your invoice is ready:</p>
                  <a
                    href={`data:${order.invoiceContentType};base64,${order.invoice}`}
                    download={`Invoice-${order._id}.pdf`}
                  >
                    Download Invoice
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back Button */}
      <button onClick={handleBackToMain} className="back-button">
        Back to Main Page
      </button>
    </div>
  );
};

export default TrackPage;
