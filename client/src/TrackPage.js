import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Axios for making HTTP requests
import "./TrackPage.css";
import logo from "./logo.png";

const TrackPage = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null); // Store the latest order
  const [loading, setLoading] = useState(true); // Indicates if data is loading
  const [error, setError] = useState(null); // Stores any error messages
  const [invoiceUrl, setInvoiceUrl] = useState(""); // URL for the invoice PDF
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false); // Track invoice visibility

  // Handle navigation back to the main page
  const handleGoBack = () => {
    navigate("/"); // Replace '/' with the correct path to your main page
  };

  // Fetch the latest order on component mount
  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const userId = localStorage.getItem("user"); // Fetch user ID from localStorage
        if (!userId) {
          throw new Error("User not logged in.");
        }

        // Make a GET request to fetch the latest order
        const response = await axios.get("/api/track/latest", {
          params: { userId }, // Pass userId as a query parameter
        });

        // Update order state with the fetched data
        setOrder(response.data.order);
      } catch (err) {
        console.error("Error fetching the latest order:", err);
        setError("Failed to load your latest order. Please try again.");
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };

    fetchLatestOrder();
  }, []);

  const toggleInvoice = async (purchaseId) => {
    if (isInvoiceVisible) {
      // Hide the invoice
      setInvoiceUrl("");
      setIsInvoiceVisible(false);
    } else {
      // Fetch and display the invoice
      try {
        const response = await axios.get(
          `api/track/invoice/invoice-${purchaseId}.pdf`,
          { responseType: "blob" }
        );
        if (response.status === 200) {
          const url = URL.createObjectURL(response.data);
          setInvoiceUrl(url); // Set the URL for the iframe
          setIsInvoiceVisible(true);
        } else {
          alert("Error: Unable to fetch the invoice.");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      }
    }
  };

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
        {/* Display order details */}
        {!loading && !error && order ? (
          <div className="order-box">
            <div className="order-info">
              <span>Purchase ID:</span>
              <span>{order.purchaseId}</span>
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
            <div className="product-header">
              <h3>Products</h3>
            </div>
            <ul className="product-list">
              {order.products.map((product) => (
                <li key={product.productId} className="product-item">
                  <span>{product.name}</span>
                  <span> x {product.quantity}</span>
                </li>
              ))}
            </ul>

            {/* Button to toggle the invoice */}
            <button
              onClick={() => toggleInvoice(order.purchaseId)}
              className="view-invoice-btn"
            >
              {isInvoiceVisible ? "Close Invoice" : "View Invoice"}
            </button>

            {/* Display the invoice PDF in an iframe */}
            {isInvoiceVisible && invoiceUrl && (
              <div className="invoice-container">
                <iframe
                  src={invoiceUrl}
                  width="100%"
                  height="600px"
                  title="Invoice"
                  frameBorder="0"
                />
              </div>
            )}
          </div>
        ) : (
          !loading && !error && <p>No recent orders found.</p>
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
