import React, { useState, useEffect } from 'react';
import logo from './logo.png';
import './PurchasePage.css';

const PurchasePage = () => {

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

    const [isFormCompleted, setIsFormCompleted] = useState({
        shipping: false,
        billing: false,
        card: false
    });

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

    const [activeSection, setActiveSection] = useState("address"); // default section is 'address'

    const handlePayment = () => {
        // Handle the payment logic here
        alert("Payment successfully completed!");
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
                        </div>
                    )}
                </div>

                {/* Order Summary Section */}
                <div className="column side">
                    <div className="container">
                        
                            <h4 className = "centered">Order Summary</h4>
                            <hr />
                            <label>Products:</label>
                            <p>Product 1 <span className="price">$150</span></p>
                            <p>Product 2 <span className="price">$272</span></p>
                            <p>Product 3 <span className="price">$79</span></p>
                            <label>Product Total: <span className="price">$401</span></label>
                            <label>Shipping Fee: <span className="price">$20</span></label>
                            <hr />
                            <h4>Order Total: <span className="price">$421</span></h4>
                       
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PurchasePage;
