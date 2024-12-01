import React from "react";
import { useNavigate } from "react-router-dom";
import "./TrackPage.css";
import logo from './logo.png';

const TrackPage = () => {

  const navigate = useNavigate();

  const handleGoBack = () => {
      navigate('/'); // Replace '/' with the correct path to your main page
  };

    return (
        <div className="trackpage-container">
            <header className="trackpage-header">
                <img src={logo} alt="Logo" className="logo" />
                <h1 className="page-title">Your Orders</h1>
            </header>
            <h2 className="subtitle">Your Most Recent Order</h2>
            <div className="trackorder-container">
                <div className="order-box">
                    <div className="order-info">
                        <span>Order ID:</span>
                        <span>#12345</span>
                    </div>
                    <div className="order-info">
                        <span>Status:</span>
                        <span>Shipped</span>
                    </div>
                    <div className="order-info">
                        <span>Estimated Delivery:</span>
                        <span>Dec 5, 2024</span>
                    </div>
                </div>
                <div className="order-box">
                    <div className="order-info">
                        <span>Order ID:</span>
                        <span>#12346</span>
                    </div>
                    <div className="order-info">
                        <span>Status:</span>
                        <span>Processing</span>
                    </div>
                    <div className="order-info">
                        <span>Estimated Delivery:</span>
                        <span>Dec 10, 2024</span>
                    </div>
                </div>
                {/* Add more order boxes as needed */}
            </div>
            <button className="go-back-btn" onClick={handleGoBack}>
                Go Back to Main Page
            </button>
        </div>
    );
};

export default TrackPage;
