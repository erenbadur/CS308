// SignInPage.js

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SignInPage = () => {
  const navigate = useNavigate();

  // State management for form inputs and feedback messages
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:3000/api/auth/signin', { // Ensure correct endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      // Log the entire response for debugging
      console.log('Response Status:', response.status);
      console.log('Response Data:', data);

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
    <Container
      maxWidth="lg"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
      }}
    >
      <Grid container sx={{ boxShadow: 5, borderRadius: 2, overflow: 'hidden' }}>
        {/* Left Side - Description */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            background: 'linear-gradient(900deg, #2e3a59, #426ff5)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 4,
            animation: 'fadeIn 1s ease-in-out',
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            Don't have an account yet? Sign up now!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            We're thrilled to have you join our community of technology enthusiasts. At N308, we strive to provide the best products and services to meet your needs. Sign up today and start exploring our wide range of offerings!
          </Typography>
          
        </Grid>

        {/* Right Side - Sign Up Form */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
            padding: 4,
          }}
        >
          <Box
            sx={{
              padding: 5, 
              borderRadius: '10px', 
              boxShadow: '0px 0px 15px 10px rgba(0, 0, 0, 0.1)', 
              backgroundColor: '#fff',
              maxWidth: 400, 
              width: '100%',
              textAlign: 'center',
              animation: 'fadeIn 1s ease-in-out', 
            }}
          >
            <Typography variant="h4" sx={{ mb: 3, color: '#333' }}>
              Sign Up
            </Typography>

            {error && (
              <Alert
                severity="error"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => setError(null)}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => setSuccess(null)}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{ mb: 2 }}
              >
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                required
                sx={{ mb: 2 }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                label="Email"
                variant="outlined"
                type="email"
                fullWidth
                required
                sx={{ mb: 2 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                label="Password"
                variant="outlined"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                sx={{ mb: 2 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 2,
                  backgroundColor: '#426ff5',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#71b7e6',
                  },
                }}
              >
                Sign Up
              </Button>
            </form>

            <Typography variant="body2" sx={{ mt: 2, color: '#333' }}>
              Already have an account?{' '}
              <Button
                onClick={() => navigate('/login')}
                sx={{
                  color: '#426ff5',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#71b7e6',
                    textDecoration: 'underline',
                  },
                }}
              >
                Log In
              </Button>
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SignInPage;
