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

    const handleAddressChange = (e, regex) => {
        const { name, value } = e.target;
    
        if (regex && !regex.test(value)) {
            return; // Prevent invalid input
        }
    
        setShippingAddr({
            ...shippingAddr,
            [name]: value,
        });
    };
    
    const handlePaymentChange = (e, regex) => {
        const { name, value } = e.target;
    
        if (regex && !regex.test(value)) {
            return; // Prevent invalid input
        }
    
        setCardInfo({
            ...cardInfo,
            [name]: value,
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
        // Check if Address Info contains any "" values
        const isAddressValid = 
            shippingAddr.fullName !== '' && 
            shippingAddr.phoneNum !== '' && 
            shippingAddr.address !== '' && 
            shippingAddr.country !== '' && 
            shippingAddr.postalCode !== '';
    
        // Check if Payment Info contains any "None" values
        const isPaymentValid = 
            cardInfo.cardName !== '' && 
            cardInfo.cardNum !== '' && 
            cardInfo.exprDate !== '' && 
            cardInfo.cvv !== '';
    
        // Only proceed with the payment if both Address Info and Payment Info are valid
        if (isAddressValid && isPaymentValid) {
            alert('Payment completed!');
    
            // After payment, navigate to the /track page
            navigate('/track'); // Navigate to the Track page
        } else {
            alert('Please complete both Address and Payment Information before proceeding.');
        }
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
                                onChange={(e) => handleAddressChange(e, /^[A-Za-z\s]*$/)} // Only letters and spaces
                            />
                            <input
                                type="text"
                                name="phoneNum"
                                placeholder="Phone Number"
                                value={shippingAddr.phoneNum}
                                onChange={(e) => handleAddressChange(e, /^\d{0,11}$/)} // Only numbers, max 11 digits
                            />
                            <input
                                type="text"
                                name="address"
                                placeholder="Address"
                                value={shippingAddr.address}
                                onChange={handleAddressChange} // No validation needed for address itself
                            />
                            <input
                                type="text"
                                name="country"
                                placeholder="Country"
                                value={shippingAddr.country}
                                onChange={(e) => handleAddressChange(e, /^[A-Za-z\s]*$/)} // Only letters and spaces
                            />
                            <input
                                type="text"
                                name="postalCode"
                                placeholder="Postal Code"
                                value={shippingAddr.postalCode}
                                onChange={(e) => handleAddressChange(e, /^\d*$/)} // Only numbers
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
                                onChange={(e) => handlePaymentChange(e, /^[A-Za-z\s]*$/)} // Only letters and spaces
                            />
                            <input
                                type="text"
                                name="cardNum"
                                placeholder="Card Number"
                                value={cardInfo.cardNum}
                                onChange={(e) => handlePaymentChange(e, /^\d{0,4}(\d{0,4}-){0,3}\d{0,4}$/)} // Format: DDDD-DDDD-DDDD-DDDD
                            />
                            <input
                                type="text"
                                name="exprDate"
                                placeholder="Expiration Date (DD/DD)"
                                value={cardInfo.exprDate}
                                onChange={(e) => handlePaymentChange(e, /^\d{0,2}\/{0,1}\d{0,2}$/)} // Format: DD/DD
                            />
                            <input
                                type="text"
                                name="cvv"
                                placeholder="CVV"
                                value={cardInfo.cvv}
                                onChange={(e) => handlePaymentChange(e, /^\d{0,3}$/)} // Only 3 digits
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