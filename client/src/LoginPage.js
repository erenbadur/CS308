import React, { useState } from 'react';
import './LoginPage.css';
import logo from './logo.png';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState(''); // Use username instead of email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate(); 

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
  
    try {
      const response = await fetch('/api/auth/login', { // Updated URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // Send username and password
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message || 'Username or password is incorrect');
      } else {
        setSuccess('Welcome');
        setUsername(''); // Clear the username field
        setPassword(''); // Clear the password field
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="main-container">
      <div className="info-section">
        <div className="logo">
          <img src={logo} alt="Site Logo" />
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
          {error && (
            <div className="error-popup">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Close</button>
            </div>
          )}
          {success && (
            <div className="success-popup">
              <p>{success}</p>
              <button onClick={() => setSuccess(null)}>Close</button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
              <label>Username</label>
            </div>
            <div className="input-box">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <div className="input-box">
              <input type="submit" value="Login" />
            </div>
          </form>
          <div id="google" className="google-login">
            <button>
            <button onClick={handleSignIn}>Sign In</button> {/* Sign in button */}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
