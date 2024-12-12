import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WishlistPage.css'; // Import the stylesheet

const WishlistPage = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/wishlist/USER_ID') // Replace USER_ID with the logged-in user ID
            .then((res) => res.json())
            .then((data) => setWishlistItems(data.wishlist))
            .catch((err) => console.error('Error fetching wishlist:', err));
    }, []);

    const navigateToMain = () => {
        navigate('/');
    };

    return (
        <div className="wishlist-container">
            {/* Back Arrow */}
            <button onClick={navigateToMain} className="back-arrow" title="Go Back">
                ←
            </button>

            {/* Page Title */}
            <h1 className="wishlist-title">Your Wishlist</h1>

            {/* Wishlist Items */}
            {wishlistItems.length > 0 ? (
                <div>
                    {wishlistItems.map((item, index) => (
                        <div key={index} className="wishlist-item">
                            <h2>{item.productId.name}</h2>
                            <p>Price: ${item.productId.price}</p>
                            <p className={item.productId.discount ? 'discount' : 'no-discount'}>
                                {item.productId.discount ? 'Discount' : 'No Discount'}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="empty-message">Your wishlist is currently empty. Please check again after adding items to your wishlist.</p>
            )}
        </div>
    );
};

export default WishlistPage;
