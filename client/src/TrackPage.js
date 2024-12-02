import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Axios for making HTTP requests
import "./TrackPage.css";
import logo from "./logo.png";

const TrackPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]); // Stores fetched orders
  const [loading, setLoading] = useState(true); // Indicates if data is loading
  const [error, setError] = useState(null); // Stores any error messages

  // Handle navigation back to the main page
  const handleGoBack = () => {
    navigate("/"); // Replace '/' with the correct path to your main page
  };

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("user"); // Fetch user ID from localStorage
        if (!userId) {
          throw new Error("User not logged in.");
        }

        // Make a GET request to fetch the latest orders
        const response = await axios.get("/api/track/latest", {
          params: { userId }, // Pass userId as a query parameter
        });

        // Update orders state with the fetched data
        setOrders(response.data.orders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="trackpage-container">
      <header className="trackpage-header">
        <img src={logo} alt="Logo" className="logo" />
        <h1 className="page-title">Order Tracking Page</h1>
      </header>
      <h2 className="subtitle">Your Most Recent Order</h2>

      {/* Show loading spinner or message */}
      {loading && <p>Loading...</p>}
      
      {/* Show error message if there's an error */}
      {error && <p className="error-message">{error}</p>}

      <div className="trackorder-container">
        {/* Map through fetched orders and display them */}
        {!loading && !error && orders.length > 0 ? (
          orders.map(({ order, productName }) => (
            <div key={order._id} className="order-box">
              <div className="order-info">
                <span>Product:</span>
                <span>{productName} x {order.quantity}</span>
              </div>
              <div className="order-info">
                <span>Status:</span>
                <span>{order.status}</span>
              </div>
              <div className="order-info">
                <span>Estimated Delivery:</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))
        ) : (
          // Show this message if no orders are found
          !loading &&
          !error && <p>No recent orders found.</p>
        )}
      </div>

      {/* Button to navigate back to the main page */}
      <button className="go-back-btn" onClick={handleGoBack}>
        Go Back to Main Page
      </button>
    </div>
  );
};

export default TrackPage;
