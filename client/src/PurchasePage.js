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
    
        // Allow empty input or match regex
        if (regex && value && !regex.test(value)) {
            return; // Reject invalid input
        }
    
        setShippingAddr({
            ...shippingAddr,
            [name]: value,
        });
    };
    

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
    
        // Field-specific validation
        if (name === 'exprDate') {
            if (!/^(\d{0,2})\/?(\d{0,2})$/.test(value)) return;
        } else if (name === 'cvv') {
            if (!/^\d{0,3}$/.test(value)) return;
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
    const handleCompletePayment = async () => {
        const userId = localStorage.getItem("user");
        if (!userId) {
            alert("You must be logged in to complete the purchase.");
            return;
        }
    
        // Validate address
        const isAddressValid =
            shippingAddr.fullName.trim().length > 0 &&
            /^\d{10,15}$/.test(shippingAddr.phoneNum) && // Accept 10-15 digit phone numbers
            shippingAddr.address.trim().length > 0 &&
            shippingAddr.country.trim().length > 0 &&
            shippingAddr.postalCode.trim().length > 0;
    
        // Validate payment
        const isPaymentValid =
            cardInfo.cardName.trim().length > 0 &&
            /^\d{16}$/.test(cardInfo.cardNum) && // Accept exactly 16 digits for card number
            /^\d{2}\/\d{2}$/.test(cardInfo.exprDate) && // Match MM/YY format
            /^\d{3}$/.test(cardInfo.cvv); // Match 3-digit CVV
    
        if (!isAddressValid || !isPaymentValid) {
            alert("Please complete all required fields in Address and Payment Information.");
            return;
        }
    
        setShowModal(true);
        setModalMessage("Processing order...");
        setIsProcessing(true);
    
        try {
            for (const item of cartItems) {
                // Add item to purchase history
                await axios.post("/api/purchases/add", {
                    userId,
                    productId: item.productId,
                    quantity: item.quantity,
                });
    
                // Confirm payment and send shipping address
                await axios.post("/api/purchases/confirm-payment", {
                    userId,
                    productId: item.productId,
                    quantity: item.quantity,
                    shippingAddress: shippingAddr, // Pass the address to the server
                });
            }
    
            setModalMessage("Payment completed successfully.");
            setTimeout(() => {
                navigate("/track");
            }, 3000);
        } catch (error) {
            console.error("Error during payment processing:", error.response || error);
            setModalMessage("Error during payment processing.");
        } finally {
            setIsProcessing(false);
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
                <h2>Order Summary</h2>
                <div className="section-content">
                    {cartItems.map((item) => (
                        <div key={item.productId}>
                            <p>{item.name}</p>
                            <p>{item.quantity} x ${(item.price).toFixed(2)}</p>
                        </div>
                    ))}
                    <p>Product Total: ${productTotal}</p>
                    <p>Shipping Fee: ${shippingFee}</p>
                    <h4>Order Total: ${orderTotal}</h4>
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