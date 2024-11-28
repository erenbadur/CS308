import React, { useState, useEffect } from 'react';
import logo from './logo.png';
import './PurchasePage.css';
import axios from 'axios';

const PurchasePage = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

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
                // Add purchase with userId
                await axios.post("/api/purchases/add", {
                    userId,
                    productId: item.productId,
                    quantity: item.quantity,
                });
    
                // Process order
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
            }, 2000);
        } catch (error) {
            console.error("Error during payment processing:", error);
            setModalMessage("Error during payment processing.");
        } finally {
            setIsProcessing(false);
        }
    };
    

    return (
        <div>
            <div className="header">
                <div className="logo">
                    <img src={logo} alt="Logo" />
                </div>
                <h1>Payment Page</h1>
            </div>
            <div className="row">
                <div className="column main">
                    <h2>Address Information</h2>
                    <div className="container">
                        <label>Full Name</label>
                        <input
                            type="text"
                            placeholder="Jane M. Doe"
                            value={shippingAddr.fullName}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, fullName: e.target.value })}
                        />
                        <label>Phone Number</label>
                        <input
                            type="text"
                            placeholder="+90 555 555 55 55"
                            value={shippingAddr.phoneNum}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, phoneNum: e.target.value })}
                        />
                        <label>Address</label>
                        <input
                            type="text"
                            placeholder="Orta Mah. Universite Cd. No: 27"
                            value={shippingAddr.address}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, address: e.target.value })}
                        />
                        <label>Country</label>
                        <input
                            type="text"
                            placeholder="Turkey"
                            value={shippingAddr.country}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, country: e.target.value })}
                        />
                        <label>Postal Code</label>
                        <input
                            type="text"
                            placeholder="34564"
                            value={shippingAddr.postalCode}
                            onChange={(e) => setShippingAddr({ ...shippingAddr, postalCode: e.target.value })}
                        />
                        <input
                            type="checkbox"
                            checked={useDiffAddr}
                            onChange={toggleDiffAddr}
                        /> Use different billing address
                    </div>

                    {useDiffAddr && (
                        <>
                            <h2>Billing Address</h2>
                            <div className="container">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Jane M. Doe"
                                    value={billingAddr.fullName}
                                    onChange={(e) => setBillingAddr({ ...billingAddr, fullName: e.target.value })}
                                />
                                <label>Address</label>
                                <input
                                    type="text"
                                    placeholder="Orta Mah. Universite Cd. No: 27"
                                    value={billingAddr.address}
                                    onChange={(e) => setBillingAddr({ ...billingAddr, address: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <h2>Payment Information</h2>
                    <div className="container">
                        <label>Name on Card</label>
                        <input
                            type="text"
                            placeholder="Jane Mary Doe"
                            value={cardInfo.cardName}
                            onChange={(e) => setCardInfo({ ...cardInfo, cardName: e.target.value })}
                        />
                        <label>Card Number</label>
                        <input
                            type="text"
                            placeholder="1111-2222-3333-4444"
                            value={cardInfo.cardNum}
                            onChange={(e) => setCardInfo({ ...cardInfo, cardNum: e.target.value })}
                        />
                        <label>Expire Date</label>
                        <input
                            type="text"
                            placeholder="01/25"
                            value={cardInfo.exprDate}
                            onChange={(e) => setCardInfo({ ...cardInfo, exprDate: e.target.value })}
                        />
                        <label>CVV</label>
                        <input
                            type="text"
                            placeholder="111"
                            value={cardInfo.cvv}
                            onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                        />
                    </div>

                    <button className="finish-payment-btn" onClick={handlePayment}>
                        Finish Payment
                    </button>

                    {showModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>{modalMessage}</h3>
                                {!isProcessing && (
                                    <button onClick={() => setShowModal(false)}>Close</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="column side">
                    <h3>Order Summary</h3>
                    {cartItems.map((item) => (
                        <p key={item.productId}>
                            {item.name} x {item.quantity}: ${(item.price * item.quantity).toFixed(2)}
                        </p>
                    ))}
                    <p>Product Total: ${productTotal}</p>
                    <p>Shipping Fee: ${shippingFee}</p>
                    <h4>Order Total: ${orderTotal}</h4>
                </div>
            </div>
        </div>
    );
};

export default PurchasePage;
