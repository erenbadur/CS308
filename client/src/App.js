
// App.js
import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './mainpage.css'; // Import your CSS
import './PurchasePage.css';
import './LoginPage.css';
import './SignInPage.css';
import MainPage from './mainpage';
import PurchasePage from './PurchasePage';
import LoginPage from './LoginPage';
import SignInPage from './SignInPage';


function App() {
    return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={ <MainPage/> } />
            <Route path="checkout" element={ <PurchasePage/> } />
            <Route path="login" element={ <LoginPage/> } />
            <Route path="signin" element={ <SignInPage/> } />
          </Routes>
        </BrowserRouter>
      )
}

export default App;

