import React, { useState } from 'react';
import './SignInPage.css';

const SignInPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form submission from reloading the page
    setError(null);
    setSuccess(null);

    try {
      // Send data to the backend
      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }), // Send the user details
      });

      const data = await response.json();

      // Handle backend response
      if (response.status === 201) {
        setSuccess('Sign up successful! You can now log in.');
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        setError(data.message || 'Sign up failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during sign up:', error);
      setError('An error occurred during sign up. Please try again later.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Sign In</h2>
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Email</label>
          </div>
          <div className="input-box">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Password</label>
          </div>
          <div className="input-box">
            <input type="submit" value="Sign In" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
