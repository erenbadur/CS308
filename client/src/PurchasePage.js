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

    // to fecth cart 
    const [cartItems, setCartItems] = useState([]);
    const [productTotal, setProductTotal] = useState(0);
    const [orderTotal, setOrderTotal] = useState(0);
    const [shippingFee] = useState(20); 

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

                    // Calculate product total
                    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    setProductTotal(total.toFixed(2));

                    // Calculate order total (product total + shipping fee)
                    setOrderTotal((total + shippingFee).toFixed(2));
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
            }
        };

        fetchCart();
    }, []);

    const clearCart = async () => {
        const sessionId = localStorage.getItem("sessionId"); // or however you're getting the session ID
    
        try {
            const response = await axios.delete("/api/cart/clear", {
                data: { sessionId },  // Pass the data in the request body
            });
            console.log("Cart cleared:", response.data);
        } catch (error) {
            console.error("Error clearing cart:", error.response ? error.response.data : error);
        }
    };

    // Validate if all required fields are filled in a given form
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
        return(
            formData.cardName &&
            formData.cardNum &&
            formData.exprDate &&
            formData.cvv
        );
    };

    /*
    // Update form completion state on each form's data change
    useEffect(() => {
        setIsFormCompleted((prev) => ({
            ...prev,
            shipping: validateAddrForm(shippingAddr), // Validate shipping form
        }));
    }, [shippingAddr]);

    useEffect(() => {
        setIsFormCompleted((prev) => ({
            ...prev,
            billing: validateAddrForm(billingAddr), // Validate billing form
        }));
    }, [billingAddr]);

    useEffect(() => {
        setIsFormCompleted((prev) => ({
            ...prev,
            card: validateCardForm(cardInfo), // Validate card form
        }));
    }, [cardInfo]);
*/
    const [activeSection, setActiveSection] = useState("address"); // default section is 'address'

    const handlePayment = async () => {
        console.log("handle payment clicked");
        setShowModal(true); // Show the modal
        setModalMessage("Processing order...");
        setIsProcessing(true);

        try {
            // Iterate over cart items to process purchases
            for (const item of cartItems) {
                await axios.post("/api/purchases/add", {
                    userId: localStorage.getItem("user"),
                    productId: item.productId,
                    quantity: item.quantity,
                });
                await axios.post("/api/processing/order", {
                    userId: localStorage.getItem("user"), // Replace with actual user ID if dynamic
                    productId: item.productId,
                    quantity: item.quantity,
                });
            }

            // Clear the cart after successful payment processing
            clearCart();

            setModalMessage("Payment completed successfully.");
        } catch (error) {
            console.error("Error during payment processing:", error);
            setModalMessage("Error during payment processing.");
        } finally {
            setIsProcessing(false); // Stop the spinner or loading state
        }

    };

    return (
        <div>
            <div className="header">
                <div className = "logo">
                    <img
                    src={logo}
                    />
                </div>
                <h1>Payment Page</h1>
            </div>
            <div className="row">
                <div className="column main">
                    {/* Address Section */}
                    <div
                        className={`section-header ${activeSection === 'address' ? 'active' : ''}`}
                        onClick={() => setActiveSection('address')}
                    >
                        <h2>Address Information</h2>
                        {activeSection === 'address'}
                    </div>
                    {activeSection === 'address' && (
                        <div>
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
                            </div>
                            <input
                                type="checkbox"
                                name="diffAddr"
                                checked={useDiffAddr}
                                onChange={toggleDiffAddr}
                            />{' '}
                            Use different address for shipping and billing
                        </div>
                    )}

                    {/* Billing Address Section */}
                    {useDiffAddr && activeSection === 'address' && (
                        <>
                            <h2>Billing Address</h2>
                            <hr />
                            <div className="container">
                                <div className="row">
                                    <div className="column half">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Jane M. Doe"
                                            value={billingAddr.fullName}
                                            onChange={(e) => setBillingAddr({ ...billingAddr, fullName: e.target.value })}
                                        />
                                        <label>Phone Number</label>
                                        <input
                                            type="text"
                                            placeholder="+90 555 555 55 55"
                                            value={billingAddr.phoneNum}
                                            onChange={(e) => setBillingAddr({ ...billingAddr, phoneNum: e.target.value })}
                                        />
                                    </div>
                                    <div className="column half">
                                        <label>Address</label>
                                        <input
                                            type="text"
                                            placeholder="Orta Mah. Universite Cd. No: 27"
                                            value={billingAddr.address}
                                            onChange={(e) => setBillingAddr({ ...billingAddr, address: e.target.value })}
                                        />
                                        <label>Country</label>
                                        <input
                                            type="text"
                                            placeholder="Turkey"
                                            value={billingAddr.country}
                                            onChange={(e) => setBillingAddr({ ...billingAddr, country: e.target.value })}
                                        />
                                        <label>Postal Code</label>
                                        <input
                                            type="text"
                                            placeholder="34564"
                                            value={billingAddr.postalCode}
                                            onChange={(e) => setBillingAddr({ ...billingAddr, postalCode: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Payment Information Section */}
                    <div
                        className={`section-header ${activeSection === 'card' ? 'active' : ''}`}
                        onClick={() => setActiveSection('card')}
                    >
                        <h2>Payment Information</h2>
                        {activeSection === 'card'}
                    </div>
                    {activeSection === 'card' && (
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
                                id="cvv"
                                name="cvv"
                                placeholder="111"
                                value={cardInfo.cvv}
                                onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Continue Payment Section */}
                    <div
                        className={`section-header ${activeSection === 'pay' ? 'active' : ''}`}
                        onClick={() => setActiveSection('pay')}
                    >
                        <h2>Continue Payment</h2>
                        {activeSection === 'pay'}
                    </div>
                    {activeSection === 'pay' && (
                        <div className="container">
                            <button className="finish-payment-btn" onClick={handlePayment}>
                                Finish Payment
                            </button>
                             {/* Modal */}
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
                    )}
                </div>

                {/* Order Summary Section */}
                <div className="column side">
                    <div className="container">
                        <label>Products:</label>
                        {cartItems.length > 0 ? (
                            cartItems.map((item) => (
                                <p key={item.productId}>
                                    {item.name} <span className="price">${(item.price * item.quantity).toFixed(2)}</span> x {item.quantity}
                                </p>
                            ))
                        ) : (
                            <p>No products in cart</p>
                        )}
                        
                        <label>Product Total: <span className="price">${productTotal}</span></label>
                        <label>Shipping Fee: <span className="price">${shippingFee}</span></label>
                        <hr />
                        <h4>Order Total: <span className="price">${orderTotal}</span></h4>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PurchasePage;
