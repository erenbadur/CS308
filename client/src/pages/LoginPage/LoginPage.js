import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import InfoSection from './components/InfoSection';
import LoginForm from './components/LoginForm';

const getSessionId = () => {
  try {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) console.log('sessionId not found in local storage.');
    return sessionId;
  } catch (error) {
    console.error('Failed to retrieve sessionId:', error);
    return null;
  }
};

const LoginPage = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleSubmit = async (e, formState) => {
    e?.preventDefault();
    if (!formState) {
      setError(null);
      setSuccess(null);
      return;
    }

    const { username, password, setUsername, setPassword } = formState;
    setError(null);
    setSuccess(null);

    try {
      const sessionId = getSessionId();
      if (!sessionId) return;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, sessionId }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Username or password is incorrect');
      } else {
        localStorage.setItem('user', data.userId);
        setSuccess('Welcome');
        setUsername('');
        setPassword('');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="main-container">
      <InfoSection />
      <div className="login-container">
        <LoginForm
          handleSignIn={handleSignIn}
          handleSubmit={handleSubmit}
          error={error}
          success={success}
        />
      </div>
    </div>
  );
};

export default LoginPage;
