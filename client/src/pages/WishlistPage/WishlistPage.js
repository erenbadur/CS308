import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WishlistPage.css';
import axios from 'axios';
import Swal from 'sweetalert2';

const WishlistPage = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchWishlist = async () => {
            const userId = localStorage.getItem('user'); // Get userId from localStorage
            if (!userId) {
                console.error('No user ID found in localStorage.');
                setLoading(false);
                return;
            }

            try {
                // Fetch the wishlist for the user
                const wishlistResponse = await axios.get(`/api/wishlist/${userId}`);
                const wishlist = wishlistResponse.data.wishlist;

                // Fetch product details for each productId
                const productDetails = await Promise.all(
                    wishlist.map(async (item) => {
                        try {
                            const productResponse = await axios.get(`/api/products/${item.productId}`);
                            return { ...item, productDetails: productResponse.data.product };
                        } catch (err) {
                            console.error(`Error fetching product ${item.productId}:`, err.message);
                            return { ...item, productDetails: null }; // Gracefully handle missing product
                        }
                    })
                );

                setWishlistItems(productDetails);
            } catch (err) {
                console.error('Error fetching wishlist:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, []);

    const navigateToMain = () => {
        navigate('/');
    };

    const removeFromWishlist = async (wishlistItemId) => {
        try {
            await axios.delete(`/api/wishlist/${wishlistItemId}`);
            setWishlistItems((prevItems) =>
                prevItems.filter((item) => item._id !== wishlistItemId)
            );
            Swal.fire({
                icon: 'success',
                title: 'Removed',
                text: 'Item removed from wishlist successfully.',
            });
        } catch (err) {
            console.error('Error removing item from wishlist:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to remove the item from wishlist.',
            });
        }
    };

    const handleAddToCart = async (product) => {
        const sessionId = localStorage.getItem('sessionId');
        const userId = localStorage.getItem('user');

        if (!sessionId) {
            Swal.fire({
                icon: 'error',
                title: 'Session Error',
                text: 'Session ID not found. Please try again.',
            });
            return;
        }

        try {
            const response = await axios.post('/api/cart/add', {
                sessionId,
                userId,
                productId: product.productId,
                quantity: 1, // Add 1 item by default
            });

            if (response.status === 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Added to Cart',
                    text: `${product.name} has been added to your cart successfully.`,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to add the product to the cart.',
                });
            }
        } catch (err) {
            console.error('Error adding to cart:', err.message);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while adding the product to the cart.',
            });
        }
    };

    if (loading) {
        return <p>Loading your wishlist...</p>;
    }

    return (
        <div className="wishlist-container">
            <button onClick={navigateToMain} className="back-arrow" title="Go Back">
                ←
            </button>
            <h1 className="wishlist-title">Your Wishlist</h1>
            {wishlistItems.length > 0 ? (
                <div className="wishlist-grid">
                    {wishlistItems.map((item, index) => {
                        const product = item.productDetails;
                        if (!product) {
                            return (
                                <div key={index} className="wishlist-item">
                                    <p>Product details unavailable</p>
                                    <button
                                        className="remove-button"
                                        onClick={() => removeFromWishlist(item._id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div key={index} className="wishlist-item">
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="product-image"
                                />
                                <div className="product-details">
                                    <h2>{product.name}</h2>
                                    <p>Price: <strong>${product.price}</strong></p>
                                    <p><strong>Description:</strong> {product.description}</p>
                                    <p><strong>Category:</strong> {product.category || 'N/A'}</p>
                                    <p><strong>Stock:</strong> {product.quantityInStock > 0 ? `${product.quantityInStock} ` : 'Out of stock'}</p>
                                    <p><strong>Rating:</strong> {product.averageRating || 'Not rated yet'}</p>
                                </div>
                                <div className="wishlist-actions">
                                    <button
                                        className="add-to-cart-button"
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        Add to Cart
                                    </button>
                                    <button
                                        className="remove-button"
                                        onClick={() => removeFromWishlist(item._id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="empty-message">Your wishlist is currently empty.</p>
            )}
        </div>
    );
};

export default WishlistPage;
