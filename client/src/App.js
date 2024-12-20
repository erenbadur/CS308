import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Correct relative paths to CSS files
import './pages/MainPage/mainpage.css';
import './pages/LoginPage/LoginPage.css';
import './pages/SignInPage/SignInPage.css';
import './pages/PurchasePage/PurchasePage.css';

// Page components
import MainPage from './pages/MainPage/mainpage';
import LoginPage from './pages/LoginPage/LoginPage';
import SignInPage from './pages/SignInPage/SignInPage';
import PurchasePage from './pages/PurchasePage/PurchasePage';
import TrackPage from './pages/TrackPage/TrackPage';
import WishlistPage from './pages/WishlistPage/WishlistPage';
import AdminInterface from './pages/AdminInterface/AdminInterface';
import Unauthorized from './pages/Unauthorized/Unauthorized';

import PrivateRoute from './components/PrivateRoute';
function App() {
    return (
        <BrowserRouter>
            <Routes>
            <Route path='/' element={
                        <MainPage/>
                }/>                
                {/* Admin Interface */}
                <Route path='/admin' element={
                    <PrivateRoute allowedRoles={['salesManager', 'productManager']}>
                        <AdminInterface/>
                    </PrivateRoute>
                }/>
                <Route path='/login' element={<LoginPage/>}/>
                <Route path='/signin' element={<SignInPage/>}/>
                <Route path='/checkout' element={<PurchasePage/>}/>
                <Route path='/track' element={<TrackPage/>}/>
                <Route path='/wishlist' element={<WishlistPage />} />
                <Route path='/unauthorized' element={<Unauthorized />} />

            </Routes>
        </BrowserRouter>
      );
}

export default App;