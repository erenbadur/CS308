// src/PurchasePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './PurchasePage.css';
import axios from 'axios';
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

    const [cartItems, setCartItems] = useState([]);
    const [error, setError] = useState(null);

    // fetch cart
    useEffect(() => {
        const fetchCart = async () => {
            try {
                // Get sessionId and userId (from localStorage or other state)
                const sessionId = localStorage.getItem('sessionId');
                const userId = localStorage.getItem('user');
                console.log('here is the userId from  localStorage:', userId);

                // Fetch cart data from backend
                const { data } = await axios.get('/api/cart/get', {
                    params: { sessionId, userId },
                });

                setCartItems(data.items);
            } catch (err) {
                setError('Failed to fetch cart. Please try again later.');
                console.error('Error fetching cart:', err);
            }
        };

        fetchCart();
    }, []);

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2);
    };

    const handleCompletePayment = async () => {
        // Check if Address Info contains any "" values
        const isAddressValid = 
            shippingAddr.fullName !== '' && 
            shippingAddr.phoneNum !== '' && 
            shippingAddr.address !== '' && 
            shippingAddr.country !== '' && 
            shippingAddr.postalCode !== '';
    
        // Check if Payment Info contains any "" values
        const isPaymentValid = 
            cardInfo.cardName !== '' && 
            cardInfo.cardNum !== '' && 
            cardInfo.exprDate !== '' && 
            cardInfo.cvv !== '';
    
        // Only proceed if both Address Info and Payment Info are valid
        if (!isAddressValid || !isPaymentValid) {
            alert('Please complete both Address and Payment Information before proceeding.');
            return;
        }
    
        try {
            // Process payment for each item in the cart
            for (const item of cartItems) {
                await axios.post("/api/purchases/add", {
                    userId: localStorage.getItem("user"),
                    productId: item.productId,
                    quantity: item.quantity,
                });
    
                await axios.post("/api/processing/order", {
                    userId: localStorage.getItem("user"),
                    productId: item.productId,
                    quantity: item.quantity,
                });
            }
    
            // Clear the cart after successful payment processing
            await clearCart();
    
            // After successful processing, print payment completed message
            alert('Payment completed!');
            navigate('/track'); // Navigate to the Track page
        } catch (error) {
            console.error("Error during payment processing:", error);
            alert('Error during payment processing. Please try again.');
        }
    };

    const clearCart = async () => {
        const sessionId = localStorage.getItem("sessionId"); 
        const userId = localStorage.getItem('user');
        try {
            const response = await axios.delete("/api/cart/clear", {
                data: { sessionId, userId },  // Pass the data in the request body
            });
            console.log("Cart cleared:", response.data);
        } catch (error) {
            console.error("Error clearing cart:", error.response ? error.response.data : error);
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
                <div className="order-summary-container">
                    <h2>Order Summary</h2>
                    {cartItems.map((item) => (
                        <div key={item.productId} className="product-summary">
                            <span>{item.name} × {item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div>
                        <span>Product Total:</span>
                        <span>${calculateTotal()}</span>
                    </div>
                    <div>
                        <span>Shipping Fee:</span>
                        <span>$20.00</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                        <span>Order Total:</span>
                        <span>${(parseFloat(calculateTotal()) + 20).toFixed(2)}</span>
                    </div>
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