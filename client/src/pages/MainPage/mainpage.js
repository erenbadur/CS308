import React, { useState, useEffect } from 'react';
import './mainpage.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';

// Utility to get sessionId, when the program starts running the session Id should already be created and set by index.js file
const getSessionId = () => {
    try {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            console.log("sessionId not found in local storage.");
        }
        return sessionId;
    } catch (error) {
        console.error("Failed to retrieve sessionId from local storage:", error);
        return null;
    }
};

// Utility to get user Id from the local storage.
const getUserId = () => {
    try {
        const userId = localStorage.getItem('user');
        if(!userId) {
            console.log("User is not logged in. User is not found in the local storage");
        }
        return userId;
    } catch (error) {
        console.error("Failed to retrieve userId from local storage:", error);
        return null;
    }
}

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
    const [stockWarnings, setStockWarnings] = useState({}); // Track stock warnings for cart items
    const Swal = require('sweetalert2')
    const [userMap, setUserMap] = useState({});

    useEffect(() => {
        const fetchUsernames = async () => {
            if (comments.length === 0) return;

            // Extract unique userIds from comments
            const uniqueUserIds = [...new Set(comments.map(comment => comment.user))];
            console.log('Unique User IDs:', uniqueUserIds);

            // Filter out userIds already in userMap
            const userIdsToFetch = uniqueUserIds.filter(uid => !userMap[uid]);
            console.log('User IDs to fetch:', userIdsToFetch);

            const newUserMap = { ...userMap };

            const userFetchPromises = userIdsToFetch.map(async (uid) => {
                try {
                    console.log(`Fetching username for userId: ${uid}`);
                    const response = await axios.get(`/api/users/${uid}`);
                    console.log(`Fetched username for ${uid}:`, response.data.username);
                    newUserMap[uid] = response.data.username;
                } catch (error) {
                    console.error(`Error fetching user ${uid}:`, error.response?.data || error.message);
                    newUserMap[uid] = 'Anonymous'; // Assign 'Anonymous' in case of error
                }
            });

            await Promise.all(userFetchPromises);
            setUserMap(newUserMap);
            console.log('Updated User Map:', newUserMap);
        };

        if (comments.length > 0) {
            fetchUsernames();
        }
    }, [comments]);

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
    
            const userId = localStorage.getItem('user'); // Get user ID
            const response = await axios.get('/api/products/sort', { params });
            const products = response.data.products;
    
            if (userId) {
                // Fetch purchase status for all products
                const purchaseStatuses = await Promise.all(
                    products.map((product) =>
                        axios
                            .get(`/api/purchases/${userId}/${product.productId}`)
                            .then((res) => ({ productId: product.productId, hasPurchased: res.data.hasPurchased }))
                            .catch(() => ({ productId: product.productId, hasPurchased: false }))
                    )
                );
    
                // Add purchase status to each product
                const updatedProducts = products.map((product) => {
                    const purchaseStatus = purchaseStatuses.find((status) => status.productId === product.productId);
                    return { ...product, hasPurchased: purchaseStatus?.hasPurchased || false };
                });
    
                setProducts(updatedProducts);
            } else {
                setProducts(products); // No user logged in, just set products
            }
    
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
        // getSessionId() function should be used for retrieving sessionId
        const sessionId = getSessionId();
        console.log("Here is the session Id", sessionId);
        const userId = localStorage.getItem('user');
        console.log("Here is the user Id", userId)
    
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
        if (!searchTerm.trim() && !activeCategory) {
            resetSearch();
            return;
        }
    
        setIsSearching(true);
        try {
            const params = {
                term: searchTerm.trim() || undefined,
                category: activeCategory || undefined,
                sortBy, // Maintain the current sort field
                order: sortOrder, // Maintain the current sort order
                page,
                limit: pageSize,
            };
    
            console.log("Search Params:", params); // Debug log to verify parameters
    
            const response = await axios.get('/api/searchBar/search', { params });
    
            setProducts(response.data.results || []);
            setSearchTotalPages(response.data.totalPages || 1);
            setSearchCurrentPage(response.data.currentPage || 1);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(response.data.currentPage || 1);
        } catch (error) {
            console.error("Error during search:", error.response?.data || error.message);
            //alert("An error occurred during the search.");
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "An error occurred during the search!"
            });

        } finally {
            setIsSearching(false);
        }
    };
    

    const handleIncreaseQuantity = async (index) => {
        const cartItem = cartItems[index];
        // getSessionId() function should be used for retrieving sessionId
        const sessionId = getSessionId();
        const userId = localStorage.getItem('user'); // Optional
    
        try {
            console.log(`[Cart] Checking stock for:`, cartItem.productId); // Log productId
    
            // Fetch the product details to check stock
            const productResponse = await axios.get(`/api/products/${cartItem.productId}`);
            const product = productResponse.data.product;
    
            console.log(`[API] Product details fetched:`, {
                productId: product.productId,
                quantityInStock: product.quantityInStock,
            });
    
            console.log(`[Cart] Current quantity in cart:`, cartItem.quantity);
    
            // Prevent increment if it exceeds stock
            if (cartItem.quantity + 1 > product.quantityInStock) {
                setStockWarnings((prev) => ({
                    ...prev,
                    [cartItem.productId]: `Only ${product.quantityInStock} in stock.`,
                }));
                console.warn(`[Stock] Cannot increase quantity. Stock left: ${product.quantityInStock}`);
                return;
            }
    
            // Proceed to update the cart
            console.log(`[Cart] Updating cart with increased quantity.`);
            const response = await axios.put('/api/cart/update', {
                sessionId,
                userId,
                productId: cartItem.productId,
                quantity: cartItem.quantity + 1, // Increment quantity
            });
    
            if (response.status === 200) {
                console.log(`[Cart] Cart updated successfully.`);
                setCartItems(response.data.cart.items); // Update the cart state
                setStockWarnings((prev) => ({
                    ...prev,
                    [cartItem.productId]: '', // Clear warning after successful update
                }));
            } else {
                console.error('Error updating cart:', response.data.error);
            }
        } catch (error) {
            console.error('Error in handleIncreaseQuantity:', error.response?.data || error.message);
        }
    };
    
    
    const handleDecreaseQuantity = async (index) => {
        const cartItem = cartItems[index];
        //getSessionId() function should be used for retrieving sessionId
        const sessionId = getSessionId();
        const userId = localStorage.getItem('user'); // Optional
    
        try {
            const newQuantity = cartItem.quantity - 1;
    
            if (newQuantity > 0) {
                // Decrease quantity by 1
                const response = await axios.put('/api/cart/update', {
                    sessionId,
                    userId,
                    productId: cartItem.productId,
                    quantity: newQuantity,
                });
    
                if (response.status === 200) {
                    setCartItems(response.data.cart.items); // Update the cart state
                } else {
                    console.error('Error updating cart:', response.data.error);
                }
            } else {
                // Quantity is now 0, remove the item from the cart
                // Optionally, confirm with the user
                const confirmRemove = window.confirm('Do you want to remove this item from your cart?');
                if (!confirmRemove) return;
    
                const response = await axios.put('/api/cart/update', {
                    sessionId,
                    userId,
                    productId: cartItem.productId,
                    quantity: 0, // Setting quantity to 0 to remove the item
                });
    
                if (response.status === 200) {
                    setCartItems(response.data.cart.items); // Update the cart state
                } else {
                    console.error('Error removing item from cart:', response.data.error);
                }
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
        // getSessionId() function should be used for retrieving sessionId
        let sessionId = getSessionId();
        if(!sessionId){
            console.log("SessionId is null");
            return;
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
            //alert('Login failed. Please try again.');
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Login failed. Please try again!"
            });
        }
    };
    

      

    const handleProductClick = async (product) => {
        setSelectedProduct(product);
    
        if (userId) {
            try {
                const response = await axios.get(`/api/purchases/${userId}/${product.productId}`);
                setHasPurchased(response.data.hasPurchased);
            } catch (error) {
                console.error('Error checking purchase status:', error.response?.data || error.message);
                setHasPurchased(false);
            }
        } else {
            setHasPurchased(false);
        }
    
        // Fetch comments for the product
        fetchComments(product.productId, 1);
    };
    
    
    const fetchComments = async (productId, page = 1) => {
        try {
            const response = await axios.get(`/api/products/${productId}/comments`, {
                params: { page },
            });
    
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
// Handles the submission of a comment or rating
const handleSubmitComment = async () => {
    if (!newRating) {
        //alert('You must provide a rating to submit a comment.');
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "You must provide a rating to submit a comment!"
        });

        return;
    }

    if (!userId) {
        //alert('You must be logged in to submit a comment or rating.');
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "You must be logged in to submit a comment or rating!"
        });
        return;
    }

    const productId = selectedProduct.productId;

    try {
        await axios.post(`/api/products/${productId}/comment`, {
            userId,
            content: newComment.trim() || null, // Allow empty comment
            rating: parseFloat(newRating),
        });

        //alert('Your comment/rating has been submitted and is awaiting approval.');
        Swal.fire({
            icon: "success",
            text: "Your comment/rating has been submitted and is awaiting approval!"
        });

        // Clear the form
        setNewRating('');
        setNewComment('');
        setIsAddingComment(false);

        // Optionally refresh approved comments
        fetchComments(productId, 1);
    } catch (error) {
        console.error('Error submitting comment/rating:', error.response?.data || error.message);
        //alert('An error occurred while submitting your comment or rating.');
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Error submitting comment/rating!"
        });

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
        // Toggle the sorting order for the selected field
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);
    
        try {
            // Construct parameters for the API request
            const params = {
                term: searchTerm.trim() || undefined, // Include search term if present
                category: activeCategory || undefined, // Include category if selected
                sortBy: field, // Apply selected sort field
                order: newOrder, // Apply the new sort order
                page: 1, // Reset to the first page
                limit: pageSize, // Maintain the page size
            };
    
            console.log("Sorting Params:", params); // Debug log to verify parameters
    
            // Make API call
            const response = await axios.get('/api/products/sort', { params });
    
            // Update the state with the sorted products and updated pagination
            setProducts(response.data.products || []);
            setTotalPages(response.data.pagination.totalPages || 1);
            setCurrentPage(1); // Reset to the first page
        } catch (error) {
            console.error("Error during sorting:", error.response?.data || error.message);
            //alert("An error occurred during sorting. Please try again.");
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Error during sorting!"
            });
        }
    };
    

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
    };

    const handleLoginRedirect = () => {
        const sessionId = getSessionId(); // Ensure sessionId exists
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
            <p>{item.name}</p>
            <p>${item.price.toFixed(2)}</p>
        </div>
        <div className="quantity-controls">
            <button
                onClick={() => handleDecreaseQuantity(index)}
                className="quantity-btn"
            >
                -
            </button>
            <span className="quantity">{item.quantity}</span>
            <button
                onClick={() => handleIncreaseQuantity(index)}
                className="quantity-btn"
            >
                +
            </button>
        </div>
        {/* Display warning if stock limit is reached */}
        {stockWarnings[item.productId] && (
            <p className="stock-warning">{stockWarnings[item.productId]}</p>
        )}
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

            {/* Add to Cart Button */}
            <button
                className={`add-to-cart-button ${
                    product.quantityInStock === 0 || hasPurchased ? 'disabled' : ''
                }`}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering product click
                    if (!hasPurchased && product.quantityInStock > 0) {
                        handleAddToCart(product);
                    }
                }}
                disabled={product.quantityInStock === 0 || hasPurchased}
            >
                {hasPurchased
                    ? 'Already Purchased'
                    : product.quantityInStock === 0
                    ? 'Out of Stock'
                    : 'Add to Cart'}
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
                                {hasPurchased && (
    <p style={{ color: 'green' }}>You have already purchased this product.</p>
)}

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
                <strong>{userMap[comment.user] || 'Loading...'}</strong>                
                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown Date'}
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