import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'remixicon/fonts/remixicon.css';

import ReactDOM from 'react-dom/client';
import App from './App';

import { v4 as uuidv4 } from 'uuid';

// Ensure a sessionId exists
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = uuidv4();
    try {
        localStorage.setItem('sessionId', sessionId);
        console.log('Session ID generated and saved:', sessionId);
    } catch (error) {
        console.error('Error saving session ID to localStorage:', error);
    }
} else {
    console.log('Session ID retrieved from localStorage:', sessionId);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
