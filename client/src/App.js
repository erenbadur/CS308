
// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './mainpage.css'; // Import your CSS
import './PurchasePage.css';
import './ProductPage.css';
import MainPage from './mainpage';
import PurchasePage from './PurchasePage';
import ProductPage from './ProductPage';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/product/:productId" element={<ProductPage />} />
            </Routes>
        </Router>
    );
}

export default App;

