import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TrackPage.css';

const TrackPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const clearCart = async () => {
    const userId = localStorage.getItem('user');
    try {
      await axios.delete('/api/cart/delete', { params: { userId } });
      console.log('Cart cleared successfully.');
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const handleBackToMain = async () => {
    await clearCart();
    navigate('/');
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem('user');
        if (!userId) {
          setError('User not found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/track/track/${userId}`);
        setOrders(response.data.order ? [response.data.order] : []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="track-page-loading">Loading your orders...</div>;
  if (error) return <div className="track-page-error">{error}</div>;

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
              <div>
                <p><strong>Products:</strong></p>
                {order.products && order.products.length > 0 ? (
                  <ul>
                    {order.products.map((product, index) => (
                      <li key={index}>
                        {product.name || 'Unknown Product'} - Quantity: {product.quantity || 0}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No products found for this order.</p>
                )}
              </div>
              <p><strong>Status:</strong> {order.status}</p>

              {order.deliveryDetails && (
                <div className="delivery">
                  <p><strong>Delivery Status:</strong> {order.deliveryDetails.status}</p>
                  <p><strong>Delivery Address:</strong></p>
                  <ul>
                    <li>Name: {order.deliveryDetails.deliveryAddress.fullName}</li>
                    <li>Phone: {order.deliveryDetails.deliveryAddress.phoneNum}</li>
                    <li>Address: {order.deliveryDetails.deliveryAddress.address}</li>
                    <li>Country: {order.deliveryDetails.deliveryAddress.country}</li>
                    <li>Postal Code: {order.deliveryDetails.deliveryAddress.postalCode}</li>
                  </ul>
                  <p><strong>Total Delivery Price:</strong> ${order.deliveryDetails.totalPrice}</p>
                </div>
              )}

{order.invoiceDetails && (
  <div className="invoice">
    <p>Your invoice is ready:</p>
    <a
      href={`/api/track/invoices/download/${order.invoiceDetails.invoiceId}`} // Use the download API endpoint
      download={`Invoice-${order._id}.pdf`} // Provide a meaningful filename
    >
      Download Invoice
    </a>
  </div>
)}

            </div>
          ))}
        </div>
      )}
      <button onClick={handleBackToMain} className="back-button">
        Back to Main Page
      </button>
    </div>
  );
};

export default TrackPage;
