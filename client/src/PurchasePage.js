// src/PurchasePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import logo from './logo.png';

const CheckoutForm = () => {
    const [shippingAddr, setShippingAddr] = useState({
        fullName: '',
        phoneNum: '',
        address: '',
        country: '',
        postalCode: ''
    });

    const [cardInfo, setCardInfo] = useState({
        cardName: '',
        cardNum: '',
        exprDate: '',
        cvv: ''
    });

    const [showAddress, setShowAddress] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    const navigate = useNavigate(); // Initialize navigate

    const handleAddressChange = (e) => {
        setShippingAddr({
            ...shippingAddr,
            [e.target.name]: e.target.value
        });
    };

    const handlePaymentChange = (e) => {
        setCardInfo({
            ...cardInfo,
            [e.target.name]: e.target.value
        });
    };

    const toggleSection = (section) => {
        if (section === 'address-section') {
            setShowAddress(!showAddress);
        } else if (section === 'payment-section') {
            setShowPayment(!showPayment);
        }
    };

    const handleCompletePayment = () => {
        // You can add any logic for payment here
        alert('Payment completed!'); 

        // After payment, navigate to the /track page
        navigate('/track'); // Navigate to the Track page
    };

    return (
        <div className="container">
            {/* Header Section */}
            <div className="header">
                <div className="logo">
                    <img src={logo} alt="Logo" />
                </div>
                <h1>Payment Page</h1>
            </div>

            {/* Address Section */}
            <div className="column">
                <h2>Address Information</h2>
                <div className="section-content">
                    {!showAddress ? (
                        <div>
                            <p>{shippingAddr.fullName || 'None'}</p>
                            <p>{shippingAddr.phoneNum || 'None'}</p>
                            <p>{shippingAddr.address || 'None'}</p>
                            <p>{shippingAddr.country || 'None'}</p>
                            <p>{shippingAddr.postalCode || 'None'}</p>
                            <span className="section-toggle" onClick={() => toggleSection('address-section')}>
                                Edit Address
                            </span>
                        </div>
                    ) : (
                        <div>
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Full Name"
                                value={shippingAddr.fullName}
                                onChange={handleAddressChange}
                            />
                            <input
                                type="text"
                                name="phoneNum"
                                placeholder="Phone Number"
                                value={shippingAddr.phoneNum}
                                onChange={handleAddressChange}
                            />
                            <input
                                type="text"
                                name="address"
                                placeholder="Address"
                                value={shippingAddr.address}
                                onChange={handleAddressChange}
                            />
                            <input
                                type="text"
                                name="country"
                                placeholder="Country"
                                value={shippingAddr.country}
                                onChange={handleAddressChange}
                            />
                            <input
                                type="text"
                                name="postalCode"
                                placeholder="Postal Code"
                                value={shippingAddr.postalCode}
                                onChange={handleAddressChange}
                            />
                            <span className="section-toggle" onClick={() => toggleSection('address-section')}>
                                Close
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Section */}
            <div className="column">
                <h2>Payment Information</h2>
                <div className="section-content">
                    {!showPayment ? (
                        <div>
                            <p>{cardInfo.cardName || 'None'}</p>
                            <p>{cardInfo.cardNum || 'None'}</p>
                            <p>{cardInfo.exprDate || 'None'}</p>
                            <p>{cardInfo.cvv || 'None'}</p>
                            <span className="section-toggle" onClick={() => toggleSection('payment-section')}>
                                Edit Payment
                            </span>
                        </div>
                    ) : (
                        <div>
                            <input
                                type="text"
                                name="cardName"
                                placeholder="Cardholder Name"
                                value={cardInfo.cardName}
                                onChange={handlePaymentChange}
                            />
                            <input
                                type="text"
                                name="cardNum"
                                placeholder="Card Number"
                                value={cardInfo.cardNum}
                                onChange={handlePaymentChange}
                            />
                            <input
                                type="text"
                                name="exprDate"
                                placeholder="Expiration Date"
                                value={cardInfo.exprDate}
                                onChange={handlePaymentChange}
                            />
                            <input
                                type="text"
                                name="cvv"
                                placeholder="CVV"
                                value={cardInfo.cvv}
                                onChange={handlePaymentChange}
                            />
                            <span className="section-toggle" onClick={() => toggleSection('payment-section')}>
                                Close
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Summary Section */}
            <div className="side">
                <h2>Order Summary</h2>
                <div className="section-content">
                    <p>Order Summary content goes here...</p>
                </div>
            </div>

            {/* Complete Payment Button */}
            <div className="complete-payment">
                <button onClick={handleCompletePayment}>Complete Payment</button>
            </div>
        </div>
    );
};

export default CheckoutForm;