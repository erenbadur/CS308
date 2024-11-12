// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import SignInPage from './SignInPage';

/* former state of the app.js before modifications after signin
const App = () => {
    return (
        <div>
            <LoginPage />
        </div>
    );
};
*/

const App = () => {
    return (
        <div>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/" element={<LoginPage />} />
                </Routes>
            </Router>
        </div>
    );
};


export default App;





