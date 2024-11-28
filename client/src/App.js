// App.js
import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import './mainpage.css'; 
import './LoginPage.css'; 
import './SignInPage.css'; 
import './PurchasePage.css';
import MainPage from './mainpage';
import LoginPage from './LoginPage';
import SignInPage from './SignInPage';
import PurchasePage from './PurchasePage';



function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<MainPage/>}/>
                <Route path='/login' element={<LoginPage/>}/>
                <Route path='/signin' element={<SignInPage/>}/>
                <Route path='/checkout' element={<PurchasePage/>}/>
            </Routes>
        </BrowserRouter>
      );
}

export default App;