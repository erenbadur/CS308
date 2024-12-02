import React, { useState, useEffect } from 'react';
import './mainpage.css';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Utility to get or create a session ID
const getSessionId = () => {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
};


const MainPage = () => {
    const [searchTotalPages, setSearchTotalPages] = useState(1); // Total pages for search results
    const [searchCurrentPage, setSearchCurrentPage] = useState(1); // Current page in search results
    const [activeCategory, setActiveCategory] = useState(""); // State to track the active category
    const [products, setProducts] = useState([]); 
    const [currentPage, setCurrentPage] = useState(1); 
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(12);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [cartOpen, setCartOpen] = useState(false); // Track cart visibility
    const [cartItems, setCartItems] = useState([]); // Track items in the cart
    const [sortBy, setSortBy] = useState('price');
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedProduct, setSelectedProduct] = useState(null); // Track selected product for detailed view
    const [searchTerm, setSearchTerm] = useState(""); // Search term
    const [isSearching, setIsSearching] = useState(false); // Track search status
    const [comments, setComments] = useState([]); // Comments for the selected product
    const [commentsPage, setCommentsPage] = useState(1); // Current page of comments
    const [commentsTotalPages, setCommentsTotalPages] = useState(1); // Total pages of comments
    const [isAddingComment, setIsAddingComment] = useState(false); // Whether the user is adding a comment
    const [newRating, setNewRating] = useState(''); // New rating value
    const [newComment, setNewComment] = useState(''); // New comment content
    const [userId, setUserId] = useState(localStorage.getItem('user')); // Logged-in user's ID
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));
    

    useEffect(() => {
        const handleScroll = () => {
            const backToTopBtn = document.getElementById("backToTopBtn");
            if (window.scrollY > 100) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        };

        console.log('useEffect triggered:', { currentPage, activeCategory, isLoggedIn }); // Debug log
        const fetchData = async () => {
            await fetchCart(); // Ensure the cart is fetched on page load
        };

        fetchData();
            
    
        // Attach the scroll event listener
        window.addEventListener('scroll', handleScroll);
    
        // Fetch products and cart when the component mounts
        if (!isSearching) {
            // Wrap in an async function to use await properly
            const fetchData = async () => {
                await fetchProducts();
            };
            fetchData();
        }
    
        // Cleanup: remove the scroll event listener on unmount
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [currentPage, activeCategory, isLoggedIn]);
    
    const fetchProducts = async (page = currentPage) => {
        try {
            const params = {
                page,
                limit: pageSize,
                sortBy,
                order: sortOrder,
            };
    
            if (activeCategory) {
                params.category = activeCategory;
            }
    
            const response = await axios.get('/api/products/sort', { params });
            setProducts(response.data.products);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };
    

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const resetSearch = () => {
        setIsSearching(false);
        setSearchTerm('');
        setSearchTotalPages(1);
        setSearchCurrentPage(1);
        setCurrentPage(1);
        setTotalPages(1);
        fetchProducts(); // Fetch regular products
    };
    
    const fetchCart = async () => {
        const sessionId = localStorage.getItem('sessionId');
        const userId = localStorage.getItem('userId'); // Ensure correct retrieval of userId
    
        console.log('Fetching cart with:', { sessionId, userId }); // Debug log
    
        if (!sessionId && !userId) {
            console.error('Neither sessionId nor userId is available.');
            return; // Exit early
        }
    
        try {
            const response = await axios.get('/api/cart/get', {
                params: { sessionId, userId },
            });
    
            if (response.status === 200) {
                console.log('Cart fetched successfully:', response.data);
                setCartItems(response.data.items || []);
            } else {
                console.error('Error fetching cart:', response.data.error);
            }
        } catch (error) {
            console.error('Error fetching cart:', error.response?.data || error.message);
        }
    };
    
    
    
    


    const toggleCart = () => {
        setCartOpen(!cartOpen); // Toggle cart visibility
    };
    
    const closeCart = () => {
        setCartOpen(false); // Close cart
    };
    const handleSearch = async (page = 1) => {
        if (!searchTerm.trim()) {
            resetSearch();
            return;
        }
    
        setIsSearching(true);
        try {
            const response = await axios.get('/api/searchBar/search', {
                params: {
                    term: searchTerm,
                    category: activeCategory,
                    page,
                    limit: pageSize,
                },
            });
    
            setProducts(response.data.results || []);
            setSearchTotalPages(response.data.totalPages || 1);
            setSearchCurrentPage(response.data.currentPage || 1);
            setTotalPages(response.data.totalPages || 1); // Update totalPages for pagination controls
            setCurrentPage(response.data.currentPage || 1);
        } catch (error) {
            console.error("Error during search:", error.response?.data || error.message);
            alert("An error occurred during the search. Please try again.");
            setIsSearching(false);
        } 
    
    
        console.log("Search initiated");
        console.log("Search Term:", searchTerm);
        console.log("Active Category:", activeCategory);
    
        setIsSearching(true); // Start search indicator
        try {
            const response = await axios.get('/api/searchBar/search', {
                params: { term: searchTerm, category: activeCategory },
            });
    
            console.log("Search Results:", response.data);
            setProducts(response.data.results || []); // Update product list
        } catch (error) {
            console.error("Error during search:", error.response?.data || error.message);
            alert("An error occurred during the search. Please try again.");
        } finally {
            setIsSearching(false); // End search indicator
        }
    };

    const handleIncreaseQuantity = async (index) => {
        const cartItem = cartItems[index];
        const sessionId = localStorage.getItem('sessionId');
        const userId = localStorage.getItem('user'); // Optional
    
        try {
            const response = await axios.put('/api/cart/update', {
                sessionId,
                userId,
                productId: cartItem.productId,
                quantity: cartItem.quantity + 1, // Increment quantity
            });
    
            if (response.status === 200) {
                setCartItems(response.data.cart.items); // Update the cart state
            } else {
                console.error('Error updating cart:', response.data.error);
            }
        } catch (error) {
            console.error('Error in handleIncreaseQuantity:', error.response?.data || error.message);
        }
    };
    
    
    const handleDecreaseQuantity = async (index) => {
        const cartItem = cartItems[index];
        const sessionId = localStorage.getItem('sessionId');
        const userId = localStorage.getItem('user'); // Optional
    
        try {
            const response = await axios.put('/api/cart/update', {
                sessionId,
                userId,
                productId: cartItem.productId,
                quantity: cartItem.quantity - 1, // Decrement quantity
            });
    
            if (response.status === 200) {
                setCartItems(response.data.cart.items); // Update the cart state
            } else {
                console.error('Error updating cart:', response.data.error);
            }
        } catch (error) {
            console.error('Error in handleDecreaseQuantity:', error.response?.data || error.message);
        }
    };
    
    const handleCheckout = () => {
        const user = localStorage.getItem('user'); // Check if the user is logged in
        if (user) {
            window.location.href = '/checkout'; // Redirect to the checkout page
        } else {
            window.location.href = '/login'; // Redirect to the login page
        }
    };    
    
    const handleAddToCart = async (product) => {

        if (product.quantityInStock === 0) {
            console.warn(`Product ${product.productId} is out of stock and cannot be added to the cart.`);
            return; // Exit the function
        }

        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = uuidv4();
            localStorage.setItem('sessionId', sessionId); // Save a new sessionId in localStorage
        }
    
        const userId = localStorage.getItem('user'); // Optional for logged-in users
    
        try {
            const response = await axios.post('/api/cart/add', {
                sessionId,
                userId,
                productId: product.productId, // Ensure product.productId is sent
                quantity: 1, // Add 1 item by default
            });
    
            if (response.status === 200) {
                setCartItems(response.data.cart.items); // Update the cart state with populated items
            } else {
                console.error('Error adding item to cart:', response.data.error);
            }
        } catch (error) {
            console.error('Error in handleAddToCart:', error.response?.data || error.message);
        }
    };
    
        
    const handleButtonClick = (category) => {
        if (activeCategory === category) {
            setActiveCategory('');
        } else {
            setActiveCategory(category);
        }
        setCurrentPage(1);  
    };

    const goToNextPage = () => {
        if (isSearching) {
            if (searchCurrentPage < searchTotalPages) {
                handleSearch(searchCurrentPage + 1);
            }
        } else {
            if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
                fetchProducts(currentPage + 1);
            }
        }
    };
    
    const goToPrevPage = () => {
        if (isSearching) {
            if (searchCurrentPage > 1) {
                handleSearch(searchCurrentPage - 1);
            }
        } else {
            if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
                fetchProducts(currentPage - 1);
            }
        }
    };
    const handleLogin = async (username, password) => {
        const sessionId = getSessionId(); // Get the session ID
    
        try {
            const response = await axios.post('/api/auth/login', {
                username,
                password,
                sessionId,
            });
    
            if (response.status === 200) {
                // Save the user ID to localStorage
                localStorage.setItem('user', response.data.userId);
    
                // Fetch the cart to get the merged items
                fetchCart();
            }
        } catch (error) {
            console.error('Error during login:', error.response?.data || error.message);
            alert('Login failed. Please try again.');
        }
    };
    

      


      const handleProductClick = async (product) => {
        setSelectedProduct(product);

        const userId = localStorage.getItem('user'); // Get logged-in user ID
        if (userId) {
            try {
                const response = await axios.get('/api/purchases/orders', {
                    params: {
                        userId,
                        productId: product.productId,
                    },
                });
                console.log(response.data); // Log the response

                setHasPurchased(response.data.hasPurchased || false); // Ensure hasPurchased is always a boolean
            console.log('Has Purchased:', response.data.hasPurchased);

            } catch (error) {
                console.error('Error checking purchase history:', error.response?.data || error.message);
            }
        } else {
            setHasPurchased(false); // User not logged in
        }
        

        // Fetch comments for the product
        fetchComments(product.productId, 1); // Fetch first page of comments
        
    };
    const fetchComments = async (productId, page) => {
        try {
            const response = await axios.get(`/api/products/${productId}/comments`, {
                params: { page },
            });
            console.log('Fetching comments for productId:', productId, 'on page:', page);
            setComments(response.data.comments);
            setCommentsPage(response.data.pagination.currentPage);
            setCommentsTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching comments:', error.response?.data || error.message);
        }
    };

    const handlePrevCommentsPage = () => {
        if (commentsPage > 1) {
            fetchComments(selectedProduct.productId, commentsPage - 1);
        }
    };

    const handleNextCommentsPage = () => {
        if (commentsPage < commentsTotalPages) {
            fetchComments(selectedProduct.productId, commentsPage + 1);
        }
    };

    const handleAddCommentClick = () => {
        setIsAddingComment(true);
    };

    const handleSubmitComment = async () => {
        if (!newRating && !newComment.trim()) {
            alert('You must enter a rating or a comment');
            return;
        }

        if (!userId) {
            alert('You must be logged in to submit a comment');
            return;
        }

        const productId = selectedProduct.productId;
        console.log('Current userId:', userId);
        const username = localStorage.getItem('username') || 'Anonymous'; // Fetch username from storage or use default

        try {
            // If rating is given, submit rating
            if (newRating) {
                const ratingResponse = await axios.post(`/api/products/${productId}/rate`, {
                    userId,
                    username,
                    rating: parseFloat(newRating),
                });
                console.log('Rating submitted:', ratingResponse.data);
            }

            // If comment is given, submit comment
            if (newComment.trim()) {
                const commentResponse = await axios.post(`/api/products/${productId}/comment`, {
                    userId,
                    content: newComment.trim(),
                });
                console.log('Comment submitted:', commentResponse.data);
            }

            // After submission, reset form and go back to product page
            setNewRating('');
            setNewComment('');
            setIsAddingComment(false);

            // Refresh comments
            fetchComments(productId, 1);

            // Update product rating
            // Fetch the updated product details
            const productResponse = await axios.get(`/api/products/${productId}`);
            setSelectedProduct(productResponse.data.product);
        } catch (error) {
            console.error('Error submitting comment/rating:', error.response?.data || error.message);
            alert(error.response?.data?.error || 'An error occurred while submitting your comment.');
        }
    };

    const handleBackToProducts = () => {
        setSelectedProduct(null);
        setHasPurchased(false);
        setComments([]);
        setCommentsPage(1);
        setCommentsTotalPages(1);
    };

    const handleSortChange = async (field) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);
    
        // Reset to the first page on sorting change
        setCurrentPage(1);

        try {
            const response = await axios.get(`/api/products/sort`, {
                params: {
                    sortBy: field,
                    order: newOrder,
                    page: 1, // Reset to the first page on sort change
                    limit: 9, // Enforce the 9-products-per-page rule
                },
            });
            setProducts(response.data.products);
            setCurrentPage(1); // Reset the current page to 1
            setTotalPages(response.data.pagination.totalPages); // Update total pages from the backend response
        } catch (error) {
            console.error('Error sorting products:', error.response?.data || error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
    };

    const handleLoginRedirect = () => {
        const sessionId = getSessionId(); // Ensure sessionId exists
        getSessionId(); // Ensures sessionId is stored before redirecting
        window.location.href = `/login?sessionId=${sessionId}`;
    };
    
    return (
        <div>
            <div id="home-section"></div>

            {/* Navbar */}
            <div className="navbar">
                <div className="nav-links">
                    <a href="#home-section" className="nav-link">Home</a>
                    <a href="#popular-section" className="nav-link">Popular</a>
                    <a href="#about-section" className="nav-link">About</a>
                </div>
                <div className="nav-items">
                    <div className="category-dropdown">
                        <button className="first-button">Product Category</button>

                        <div className="category-dropdown-content">
                            {/* Category Buttons */}
                            <div className="category-card">
                                <img src="resimler/pone_new.webp" alt="Phone" />
                                <p>Phone</p>
                                <button
                                    className={`category-button ${
                                        activeCategory === 'mobile phone' ? 'active' : ''
                                    }`}
                                    onClick={() => handleButtonClick('mobile phone')}
                                >
                                    {activeCategory === 'mobile phone' ? 'Deselect' : 'Select'}
                                </button>
                            </div>
                            <div className="category-card">
                                <img src="resimler/computer.webp" alt="Computer" />
                                <p>Computer</p>
                                <button
                                    className={`category-button ${
                                        activeCategory === 'computer' ? 'active' : ''
                                    }`}
                                    onClick={() => handleButtonClick('computer')}
                                >
                                    {activeCategory === 'computer' ? 'Deselect' : 'Select'}
                                </button>
                            </div>
                            <div className="category-card">
                                <img src="resimler/tablet_new.webp" alt="Tablet" />
                                <p>Tablet</p>
                                <button
                                    className={`category-button ${
                                        activeCategory === 'tablet' ? 'active' : ''
                                    }`}
                                    onClick={() => handleButtonClick('tablet')}
                                >
                                    {activeCategory === 'tablet' ? 'Deselect' : 'Select'}
                                </button>
                            </div>
                            <div className="category-card">
                                <img src="resimler/accessory.webp" alt="Accessories" />
                                <p>Accessories</p>
                                <button
                                    className={`category-button ${
                                        activeCategory === 'accessories' ? 'active' : ''
                                    }`}
                                    onClick={() => handleButtonClick('accessories')}
                                >
                                    {activeCategory === 'accessories' ? 'Deselect' : 'Select'}
                                </button>
                            </div>
                            <div className="category-card">
                                <img src="resimler/headphone.webp" alt="Headphone" />
                                <p>Headphone</p>
                                <button
                                    className={`category-button ${
                                        activeCategory === 'headphone' ? 'active' : ''
                                    }`}
                                    onClick={() => handleButtonClick('headphone')}
                                >
                                    {activeCategory === 'headphone' ? 'Deselect' : 'Select'}
                                </button>
                            </div>
                            <div className="category-card">
                                <img src="resimler/smartwatch.webp" alt="Smartwatch" />
                                <p>Smartwatch</p>
                                <button
                                    className={`category-button ${
                                        activeCategory === 'smartwatch' ? 'active' : ''
                                    }`}
                                    onClick={() => handleButtonClick('smartwatch')}
                                >
                                    {activeCategory === 'smartwatch' ? 'Deselect' : 'Select'}
                                </button>
                            </div>
                            <div className="category-card">
                                <img src="resimler/tv_new.webp" alt="Television" />
                                <p>Television</p>
                                <button
                                    className={`category-button ${
                                        activeCategory === 'television' ? 'active' : ''
                                    }`}
                                    onClick={() => handleButtonClick('television')}
                                >
                                    {activeCategory === 'television' ? 'Deselect' : 'Select'}
                                </button>
                            </div>
                            <div className="category-card">
                                <img src="resimler/camera.webp" alt="Camera" />
                                <p>Camera</p>
                                <button
                                    className={`category-button ${
                                        activeCategory === 'camera' ? 'active' : ''
                                    }`}
                                    onClick={() => handleButtonClick('camera')}
                                >
                                    {activeCategory === 'camera' ? 'Deselect' : 'Select'}
                                </button>
                            </div>
                        </div>
                    </div>
 {/* Search Bar */}
{/* Search Bar */}
<div className="search-bar-container">
    <input
        type="text"
        className="search-input"
        placeholder="Search www.N308.com.tr"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Update state
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                console.log("Enter pressed. Executing search.");
                handleSearch();
            }
        }}
    />
    <button
        className="search-button"
        onClick={() => {
            console.log("Search button clicked. Executing search.");
            handleSearch();
        }}
    >
        <span className="icon">🔍</span>
    </button>
</div>


                </div>
                <button onClick={toggleCart} className="cart">
                    🛒 Cart
                </button>
                {/* Login/Logout Button */}
                {isLoggedIn ? (
                    <button onClick={handleLogout} className="login">
                        👤 Log Out
                    </button>
                ) : (
                    <button onClick={handleLoginRedirect} className="login">
                        👤 Log In
                    </button>
                )}


            </div>

            {/* Cart Panel */}
            {cartOpen && (
                <div className="cart-panel">
                    <button className="close-cart" onClick={closeCart}>X</button>
                    <h3>Your Cart</h3>
                    {cartItems.length > 0 ? (
                        <ul>
                            {cartItems.map((item, index) => (
    <li key={index} className="cart-item">
        <div className="cart-item-details">
            <p>{item.name || 'Unknown Product'}</p> {/* Fallback for missing name */}
            <p>${(item.price || 0).toFixed(2)}</p> {/* Fallback for missing price */}
        </div>
        <div className="quantity-controls">
            <button onClick={() => handleDecreaseQuantity(index)} className="quantity-btn">
                -
            </button>
            <span className="quantity">{item.quantity}</span>
            <button 
                onClick={() => handleIncreaseQuantity(index)} 
                className="quantity-btn"
                disabled={item.quantity >= item.stock}
            >
                +
            </button>
        </div>
    </li>
))}


                        </ul>
                    ) : (
                        <p>Your cart is empty.</p>
                    )}
                    {cartItems.length > 0 && (
                        <button 
                            className="checkout-btn" 
                            onClick={handleCheckout}
                        >
                            Proceed to Checkout
                        </button>
                    )}
                </div>
            )}

            
            {/* Fixed Hero Section */}
            <div className="hero-section">
                <img src="resimler/mainimage.jpg" alt="Hero Banner" className="hero-image" />
                <div className="hero-caption">
                    <h1>Welcome to N308</h1>
                    <p>Your one-stop shop for exclusive products.</p>
                </div>
            </div>

            {/* Popular Section */}
            <div id="popular-section" className="section">
                {!selectedProduct ? (
                    <>
                        <h2>Popular Products</h2>

                        {/* Sort By Dropdown */}
                        <div className="sort-by-dropdown">
                            <button className="sort-by-button">Sort By</button>
                            <div className="sort-options">
                                <div onClick={() => handleSortChange('price')}>
                                    Price {sortBy === 'price' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </div>
                                <div onClick={() => handleSortChange('popularity')}>
                                    Popularity {sortBy === 'popularity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </div>
                                <div onClick={() => handleSortChange('averageRating')}>
                                    Rating {sortBy === 'averageRating' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: "1.5em" }}>Check out some of our most popular items.</p>

                        <div className="product-grid">
                            {products.map((product) => (
                                <div
                                    className="product-card"
                                    key={product._id}
                                    onClick={() => handleProductClick(product)} // Handle product click
                                >
                                    <img src={product.imageUrl} alt={product.name} className="product-image" />
                                    <h3 className="product-name">{product.name}</h3>
                                    <p className="product-price">${product.price}</p>
                                    <div className="product-rating">
                                        <span>{'⭐️'.repeat(Math.round(product.averageRating || 0))}</span>
                                    </div>
                                    <button
    className={`add-to-cart-button ${product.quantityInStock === 0 ? 'disabled' : ''}`}
    onClick={(e) => {
        e.stopPropagation(); // Prevent triggering product click
        if (product.quantityInStock > 0) {
            handleAddToCart(product); // Call only if stock > 0
        }
    }}
    disabled={product.quantityInStock === 0} // Properly disable the button
    style={{
        pointerEvents: product.quantityInStock === 0 ? 'none' : 'auto', // Prevent any interaction if out of stock
        backgroundColor: product.quantityInStock === 0 ? 'gray' : 'orange',
        cursor: product.quantityInStock === 0 ? 'not-allowed' : 'pointer',
    }}
>
    {product.quantityInStock === 0 ? 'Out of Stock' : 'Add to Cart'}
</button>



                                </div>
                            ))}
                        </div>
                        <div className="pagination-controls">
                        <button onClick={goToPrevPage} disabled={isSearching ? searchCurrentPage === 1 : currentPage === 1}>
                        &laquo; Prev
                            </button>
                            <span>
                            Page {isSearching ? searchCurrentPage : currentPage} of {isSearching ? searchTotalPages : totalPages}
                            </span>
                            <button onClick={goToNextPage} disabled={currentPage === totalPages}>
                                Next &raquo;
                            </button>
                        </div>
                    </>
                ) : (


                    <div className="product-details">
                        <button className="product-details-back-button" onClick={handleBackToProducts}>
                         &larr; Back to Products
                        </button>

                        <div className="product-details-container">
                            {/* Left Side: Product Image */}
                            <div className="product-image-container">
                                {hasPurchased && (
                                <div className="purchased-banner">You have purchased this product</div>
                                )}
                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="product-detail-image" />
                            </div>


                        {/* Right Side: Product Information */}
                        <div className="product-info">
                                <h2>{selectedProduct.name}</h2>
                                <p className="product-description">{selectedProduct.description}</p>

                                {/* Rating */}
                                <div className="product-rating-detail">
                                <span>{'⭐️'.repeat(Math.round(selectedProduct.averageRating || 0))}</span>
                                <span className="average-rating">({Math.round(selectedProduct.averageRating || 0)})</span>
                                </div>

                                {/* Price */}
                                <p className="product-price-detail">${selectedProduct.price}</p>

                                {/* Stock Quantity */}
                                <p className="product-stock" style={{ color: 'red' }}>
                                {selectedProduct.quantityInStock} items left in stock
                                </p>

                                {/* Add to Cart Button */}
                                <button
                                onClick={() => handleAddToCart(selectedProduct)}
                                className="add-to-cart-button-detail"
                                >
                                Add to Cart
                                </button>
                        </div>
                        </div>
                            {/* Comments Section */}
                        {isAddingComment ? (
                            <div className="comment-form">
                                <button onClick={() => setIsAddingComment(false)}>Back</button>
                                {/* Rating Input */}
                                <div>
                                    <label>Rating:</label>
                                    <select value={newRating} onChange={(e) => setNewRating(e.target.value)}>
                                        <option value="">Select Rating</option>
                                        {['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'].map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                                 {/* Comment Input */}
                                 <div>
                                    <label>Comment:</label>
                                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                                </div>
                                {/* Submit Button */}
                                <button onClick={handleSubmitComment}>Submit</button>
                            </div>
                        ) : (
                            <div className="comments-section">
                            {/* Add Comment/Rating Button */}
                            <button
    className="add-comment-button"
    onClick={handleAddCommentClick}
    disabled={!(userId && hasPurchased)}
    title={
        !userId
            ? 'Please log in to add a comment or rating'
            : !hasPurchased
            ? 'You have not purchased this product, so you cannot comment or rate it'
            : ''
    }
>
    Add Comment/Rating
</button>

                                {/* Comments List */}
                                <div className="comments-section">
    {comments.length > 0 ? (
        comments.map((comment, index) => (
            <div key={index} className="comment">
                <p>
                    <strong>{comment.username || 'Anonymous'}</strong> - 
                    {comment.date ? new Date(comment.date).toLocaleDateString() : 'Unknown Date'}
                </p>
                {comment.rating && <p>Rating: {'⭐️'.repeat(Math.round(comment.rating))}</p>}
                {comment.content && <p>{comment.content}</p>}
            </div>
        ))
    ) : (
        <p>No comments available for this product yet.</p>
    )}
</div>

                                    {/* Comments Pagination */}
                                    <div className="comments-pagination">
                                    <button onClick={handlePrevCommentsPage} disabled={commentsPage <= 1}>
                                        &laquo; Prev
                                    </button>
                                    <span>
                                        Page {commentsPage} of {commentsTotalPages}
                                    </span>
                                    <button onClick={handleNextCommentsPage} disabled={commentsPage >= commentsTotalPages}>
                                        Next &raquo;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>


                    
                        )}
            </div>


            {/* About Section */}
            <div id="about-section" className="section about-section">
                <div className="about-content">
                    <h2>About Us</h2>
                    <h4>Welcome to N308, your premier e-commerce destination! We are committed to providing you with an unparalleled shopping experience by offering top-quality products, excellent customer service, and unbeatable prices.</h4>
                    <div className="about-highlights">
                        <div className="highlight">
                            <i className="ri-hand-heart-line icon"></i>
                            <h3>Customer First</h3>
                            <p>Your satisfaction is our top priority. We're here to support you at every step of your shopping journey.</p>
                        </div>
                        <div className="highlight">
                            <i className="ri-rocket-line icon"></i>
                            <h3>Fast Delivery</h3>
                            <p>Enjoy quick and reliable shipping options to get your items when you need them. We value your time!</p>
                        </div>
                        <div className="highlight">
                            <i className="ri-earth-line icon"></i>
                            <h3>Worldwide Reach</h3>
                            <p>Wherever you are, we’re there. Our global shipping options ensure everyone can shop with us.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-top">
                        <div>
                            <h6 className="footer-title">Customer Service</h6>
                            <ul className="footer-list">
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Help & FAQs</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Shipping Information</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Returns & Exchanges</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Contact Us</a></li>
                            </ul>
                        </div>
                        <div>
                            <h6 className="footer-title">Contact</h6>
                            <ul className="footer-list">
                                <li className="footer-list-item"><i className="ri-map-pin-line"></i> Istanbul, IST 34000, Turkey</li>
                                <li className="footer-list-item"><i className="ri-mail-line"></i> N308@ecommerce.com</li>
                                <li className="footer-list-item"><i className="ri-phone-line"></i> +90 234 567 88</li>
                                <li className="footer-list-item"><i className="ri-printer-line"></i> +90 234 567 89</li>
                            </ul>
                        </div>
                        <div>
                            <h6 className="footer-title">Resources</h6>
                            <ul className="footer-list">
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Gift Cards</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Size Guide</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Product Reviews</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link">Sustainability</a></li>
                            </ul>
                        </div>
                        <div>
                            <h6 className="footer-title">Follow Us</h6>
                            <ul className="footer-list">
                                <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-facebook-circle-line"></i> Facebook</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-instagram-line"></i> Instagram</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-twitter-line"></i> Twitter</a></li>
                                <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-linkedin-line"></i> LinkedIn</a></li>
                            </ul>
                        </div>
                    </div>
                    <hr className="footer-divider" />
                    <div className="footer-bottom">
                        <span>&copy; N308 E-Commerce Platform. All rights reserved.</span>
                        <ul className="footer-list">
                            <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-facebook-circle-line"></i></a></li>
                            <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-instagram-line"></i></a></li>
                            <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-twitter-line"></i></a></li>
                            <li className="footer-list-item"><a href="#" className="footer-list-link"><i className="ri-linkedin-line"></i></a></li>
                        </ul>
                    </div>
                </div>
            </footer>

            {/* Back to Top Button */}
            <button id="backToTopBtn" onClick={scrollToTop}>
                <i className="ri-arrow-up-s-line"></i>
            </button>
        </div>
    );
};

export default MainPage;