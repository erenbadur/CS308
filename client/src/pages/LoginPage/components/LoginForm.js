import React, { useState } from 'react';

const LoginForm = ({ handleSignIn, handleSubmit, error, success }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="login-box">
      <h2>Login</h2>

      {error && (
        <div className="error-popup">
          <p>{error}</p>
          <button onClick={() => handleSubmit(null)}>Close</button>
        </div>
      )}
      {success && (
        <div className="success-popup">
          <p>{success}</p>
          <button onClick={() => handleSubmit(null)}>Close</button>
        </div>
      )}

      <form
        onSubmit={(e) => handleSubmit(e, { username, password, setUsername, setPassword })}
      >
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

      <div className="google-login">
        <button onClick={handleSignIn}>Sign In</button>
      </div>
    </div>
  );
};

export default LoginForm;
