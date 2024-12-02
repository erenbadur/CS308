import React, { useState, useEffect } from 'react';
import logo from './logo.png';
import './PurchasePage.css';
import axios from 'axios';

const PurchasePage = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [stockWarnings, setStockWarnings] = useState({}); // Track stock warnings for cart items
    const [shippingAddr, setShippingAddr] = useState({
        fullName: '',
        phoneNum: '',
        address: '',
        country: '',
        postalCode: ''
    });

    const [billingAddr, setBillingAddr] = useState({
        fullName: '',
        phoneNum: '',
        address: '',
        country: '',
        postalCode: ''
    });

    const [useDiffAddr, setUseDiffAddr] = useState(false);

    const toggleDiffAddr = () => {
        setUseDiffAddr(!useDiffAddr);
    };

    const [cardInfo, setCardInfo] = useState({
        cardName: '',
        cardNum: '',
        exprDate: '',
        cvv: '',
    });

    const [cartItems, setCartItems] = useState([]);
    const [productTotal, setProductTotal] = useState(0);
    const [orderTotal, setOrderTotal] = useState(0);
    const [shippingFee] = useState(20); // Flat shipping fee

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

    const clearCart = async () => {
        const sessionId = localStorage.getItem("sessionId");
        try {
            await axios.delete("/api/cart/clear", { data: { sessionId } });
        } catch (error) {
            console.error("Error clearing cart:", error);
        }
    };

    const validateAddrForm = (formData) => {
        return (
            formData.fullName &&
            formData.phoneNum &&
            formData.address &&
            formData.country &&
            formData.postalCode
        );
    };

    const validateCardForm = (formData) => {
        return (
            formData.cardName &&
            formData.cardNum &&
            formData.exprDate &&
            formData.cvv
        );
    };

    const handlePayment = async () => {
        const userId = localStorage.getItem("user");
        if (!userId) {
            alert("You must be logged in to complete the purchase.");
            return;
        }
    
        setShowModal(true);
        setModalMessage("Processing order...");
        setIsProcessing(true);
    
        try {
            for (const item of cartItems) {
                await axios.post("/api/purchases/add", {
                    userId,
                    productId: item.productId,
                    quantity: item.quantity,
                });

                await axios.post("/api/processing/order", {
                    userId,
                    productId: item.productId,
                    quantity: item.quantity,
                });
            }
    
            clearCart();
            setModalMessage("Payment completed successfully.");
            setTimeout(() => {
                window.location.href = '/order-confirmation';
            }, 3000);
        } catch (error) {
            console.error("Error during payment processing:", error);
            setModalMessage("Error during payment processing.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <div className="purchase-page">
            <div className="header">
                <div className="logo">
                    <img src={logo} alt="Logo" />
                </div>
                <h1>Checkout</h1>
            </div>

            <div className="content">
                {/* Left Column */}
                <div className="main">
                    <div className="address-section">
                        <h2>Shipping Address</h2>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={shippingAddr.fullName}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, fullName: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            value={shippingAddr.phoneNum}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, phoneNum: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Address"
                            value={shippingAddr.address}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, address: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Country"
                            value={shippingAddr.country}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, country: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Postal Code"
                            value={shippingAddr.postalCode}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, postalCode: e.target.value })}
                        />
                        <div className="checkbox">
                            <input type="checkbox" checked={useDiffAddr} onChange={toggleDiffAddr} />
                            <span>Use a different billing address</span>
                        </div>
                    </div>

                    {useDiffAddr && (
                        <div className="address-section">
                            <h2>Billing Address</h2>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={billingAddr.fullName}
                                onChange={(e) => setBillingAddr({ ...billingAddr, fullName: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Address"
                                value={billingAddr.address}
                                onChange={(e) => setBillingAddr({ ...billingAddr, address: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="payment-section">
                        <h2>Payment Information</h2>
                        <input
                            type="text"
                            placeholder="Cardholder Name"
                            value={cardInfo.cardName}
                            onChange={(e) => setCardInfo({ ...cardInfo, cardName: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Card Number"
                            value={cardInfo.cardNum}
                            onChange={(e) => setCardInfo({ ...cardInfo, cardNum: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Expiration Date (MM/YY)"
                            value={cardInfo.exprDate}
                            onChange={(e) => setCardInfo({ ...cardInfo, exprDate: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="CVV"
                            value={cardInfo.cvv}
                            onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="summary">
                    <h3>Order Summary</h3>
                    {cartItems.map((item) => (
                        <div key={item.productId} className="summary-item">
                            <span>{item.name}</span>
                            <span>{item.quantity} x ${(item.price).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="summary-total">
                        <span>Product Total:</span>
                        <span>${productTotal}</span>
                    </div>
                    <div className="summary-total">
                        <span>Shipping Fee:</span>
                        <span>${shippingFee}</span>
                    </div>
                    <div className="summary-total">
                        <span>Order Total:</span>
                        <span>${orderTotal}</span>
                    </div>
                    <button className="complete-order-btn" onClick={handlePayment}>
                        Complete Payment
                    </button>
                </div>
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

export default PurchasePage;
