// src/pages/Unauthorized/Unauthorized.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Unauthorized.css';

const Unauthorized = () => {
    return (
        <div className="unauthorized-container">
            <h1>403 - Unauthorized Access</h1>
            <p>You do not have permission to view this page.</p>
            <Link to="/">Back to Main Page</Link>
        </div>
    );
};

export default Unauthorized;
