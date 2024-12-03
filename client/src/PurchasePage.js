
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from './logo.png';
import './PurchasePage.css';
import axios from 'axios';

const UnifiedPurchasePage = () => {
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
        exprDate: '', // MM/YY format
        cvv: '' // 3-digit format
    });

    const [cartItems, setCartItems] = useState([]);
    const [productTotal, setProductTotal] = useState(0);
    const [orderTotal, setOrderTotal] = useState(0);
    const [shippingFee] = useState(20); // Flat shipping fee

    const [showAddress, setShowAddress] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCart = async () => {
            const sessionId = localStorage.getItem('sessionId');
            if (!sessionId) {
                console.error('Session ID is required');
                return;
            }

            try {
                const response = await axios.get('/api/cart/get', {
                    params: { sessionId },
                });
                if (response.status === 200) {
                    const items = response.data.items;
                    setCartItems(items);

                    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    setProductTotal(total.toFixed(2));
                    setOrderTotal((total + shippingFee).toFixed(2));
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
            }
        };

        fetchCart();
    }, []);

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

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;

        if (name === 'exprDate') {
            // Allow only MM/YY format
            const isValid = /^(\d{0,2})\/?(\d{0,2})$/.test(value);
            if (!isValid) return;
        }

        if (name === 'cvv') {
            // Allow only 3-digit numbers
            const isValid = /^\d{0,3}$/.test(value);
            if (!isValid) return;
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
            // Process payment for cartItems
                await axios.post("/api/processing/order", {
                    userId: localStorage.getItem("user"),
                    products: cartItems
                });
            
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
                                onChange={(e) => handleAddressChange(e, /^[A-Za-z\s]*$/)}
                            />
                            <input
                                type="text"
                                name="phoneNum"
                                placeholder="Phone Number"
                                value={shippingAddr.phoneNum}
                                onChange={(e) => handleAddressChange(e, /^\d{0,11}$/)}
                            />
                            <input
                                type="text"
                                name="address"
                                placeholder="Address"
                                value={shippingAddr.address}
                                onChange={(e) => handleAddressChange(e)}
                            />
                            <input
                                type="text"
                                name="country"
                                placeholder="Country"
                                value={shippingAddr.country}
                                onChange={(e) => handleAddressChange(e, /^[A-Za-z\s]*$/)}
                            />
                            <input
                                type="text"
                                name="postalCode"
                                placeholder="Postal Code"
                                value={shippingAddr.postalCode}
                                onChange={(e) => handleAddressChange(e, /^\d*$/)}
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
                                onChange={(e) => handlePaymentChange(e)}
                            />
                            <input
                                type="text"
                                name="cardNum"
                                placeholder="Card Number"
                                value={cardInfo.cardNum}
                                onChange={(e) => handlePaymentChange(e)}
                            />
                            <input
                                type="text"
                                name="exprDate"
                                placeholder="Expiration Date (MM/YY)"
                                value={cardInfo.exprDate}
                                onChange={(e) => handlePaymentChange(e)}
                            />
                            <input
                                type="text"
                                name="cvv"
                                placeholder="CVV"
                                value={cardInfo.cvv}
                                onChange={(e) => handlePaymentChange(e)}
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

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>{modalMessage}</h3>
                        {!isProcessing && <button onClick={() => setShowModal(false)}>Close</button>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedPurchasePage;
