// src/LoginPage.js
import React, { useState } from 'react';
import './LoginPage.css';
import logo from './logo.png'; 

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="main-container">
            <div className="info-section">
                <div className="logo">
                    <img src={logo} alt="Site Logo" /> {/* Yeni logo burada kullanılıyor */}
                </div>
                <h1>Welcome to the Online Store 308</h1>
                <p>Shop your favorite products with ease and convenience. We bring the best online trading experience right to your doorstep.</p>
                <ul>
                    <li>Exclusive deals and offers</li>
                    <li>Safe and secure payments</li>
                    <li>Fast delivery</li>
                    <li>24/7 customer support</li>
                </ul>
            </div>
            <div className="login-container">
                <div className="login-box">
                    <h2>Login</h2>
                    <form>
                        <div className="input-box">
                            <input type="text" required />
                            <label>Username or E-mail</label>
                        </div>
                        <div className="input-box">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                required
                            />
                            <label>Password</label>
                        </div>
                        <div className="show-password">
                            <input
                                type="checkbox"
                                id="show-password"
                                checked={showPassword}
                                onChange={toggleShowPassword}
                            />
                            <label htmlFor="show-password">Show Password</label>
                        </div>
                        <div className="remember-me">
                            <input type="checkbox" id="remember-me" />
                            <label htmlFor="remember-me">Remember me</label>
                        </div>
                        <div className="input-box">
                            <input type="submit" value="Login" />
                        </div>
                        <p className="forgot-password">
                            <a href="#">Forgot your password?</a>
                        </p>
                        <p className="register-link">
                            Not registered? <a href="#">Create an account</a>
                        </p>
                    </form>
                    <div id="google" className="google-login">
                        <button>
                            <span className="google-icon"></span> Log in with Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
