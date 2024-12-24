import React, { useState, useEffect } from 'react';
import './mainpage.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Button,
    Menu,
    MenuItem,
    TextField,
    InputAdornment,
    Box,
    Tooltip,
    Badge,
    Divider,
    Grid,
    Rating,
    Card,
    CardMedia,
    CardContent,
    CardActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SortIcon from '@mui/icons-material/Sort';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
    const [userId, setUserId] = useState(getUserId()); // Logged-in user's ID
    const [isLoggedIn, setIsLoggedIn] = useState(!!getUserId());
    const [stockWarnings, setStockWarnings] = useState({}); // Track stock warnings for cart items
    const [userMap, setUserMap] = useState({});
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("");

    // State for Category Menu
    const [anchorElCategory, setAnchorElCategory] = useState(null);
    const openCategory = Boolean(anchorElCategory);
    const handleCategoryMenuOpen = (event) => {
        setAnchorElCategory(event.currentTarget);
    };
    const handleCategoryMenuClose = () => {
        setAnchorElCategory(null);
    };

    // State for Sort Menu
    const [anchorElSort, setAnchorElSort] = useState(null);
    const openSort = Boolean(anchorElSort);
    const handleSortMenuOpen = (event) => {
        setAnchorElSort(event.currentTarget);
    };
    const handleSortMenuClose = () => {
        setAnchorElSort(null);
    };

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
    }, [comments, userMap]);

    useEffect(() => {
        const handleScroll = () => {
            const backToTopBtn = document.getElementById("backToTopBtn");
            if (window.scrollY > 100) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        };

        console.log('useEffect triggered:', { currentPage, activeCategory, isLoggedIn, sortBy, sortOrder }); // Debug log
        const fetchData = async () => {
            await fetchCart(); // Ensure the cart is fetched on page load
        };

        fetchData();

        // Attach the scroll event listener
        window.addEventListener('scroll', handleScroll);

        // Fetch products and cart when the component mounts or dependencies change
        if (!isSearching) {
            // Wrap in an async function to use await properly
            const fetchDataAsync = async () => {
                await fetchProducts();
            };
            fetchDataAsync();
        }

        // Cleanup: remove the scroll event listener on unmount
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [currentPage, activeCategory, isLoggedIn, isSearching, sortBy, sortOrder]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/products/categories');
                console.log("Fetched Categories:", response.data); // Debug categories
                setCategories(response.data || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    const handleCategoryClick = (categoryId) => {
        setActiveCategory((prevCategory) => (prevCategory === categoryId ? "" : categoryId));
        handleCategoryMenuClose();
        setCurrentPage(1); // Reset to first page when category changes
    };

    useEffect(() => {
        if (activeCategory || searchTerm) {
            handleSearch(); // Trigger search when activeCategory or searchTerm changes
        }
    }, [activeCategory, searchTerm, sortBy, sortOrder]); // Added sortBy and sortOrder

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

            if (searchTerm.trim()) {
                params.term = searchTerm.trim();
            }

            const userId = getUserId(); // Get user ID
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
        const userId = getUserId();
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

        console.log("Initiating search with term:", searchTerm, "and category:", activeCategory);

        setIsSearching(true);
        try {
            const params = {
                term: searchTerm.trim(),
                category: activeCategory || undefined,
                sortBy,
                order: sortOrder,
                page,
                limit: pageSize,
            };

            console.log("Search Params:", params); // Debug log

            const response = await axios.get('/api/searchBar/search', { params });

            console.log("Search Response:", response.data); // Debug log

            setProducts(response.data.results || []);
            setSearchTotalPages(response.data.totalPages || 1);
            setSearchCurrentPage(response.data.currentPage || 1);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(response.data.currentPage || 1);
        } catch (error) {
            console.error("Error during search:", error.response?.data || error.message);

            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "An error occurred during the search!",
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleIncreaseQuantity = async (index) => {
        const cartItem = cartItems[index];
        // getSessionId() function should be used for retrieving sessionId
        const sessionId = getSessionId();
        const userId = getUserId(); // Optional

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
        // getSessionId() function should be used for retrieving sessionId
        const sessionId = getSessionId();
        const userId = getUserId(); // Optional

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
                    setCartItems(response.data.cart.items);
                    setStockWarnings((prev) => ({
                        ...prev,
                        [cartItem.productId]: '', // Clear warning
                    }));
                }
            } else if (newQuantity === 0) {
                // Remove the item from the cart
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
        }
        catch (error) {
            console.error('Error in handleDecreaseQuantity:', error.response?.data || error.message);
        }
    };

    const handleCheckout = () => {
        const user = getUserId(); // Check if the user is logged in
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

        const userId = getUserId(); // Optional for logged-in users

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
                setUserId(response.data.userId);

                // Fetch the cart to get the merged items
                fetchCart();
                setIsLoggedIn(true);
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

    const handleSortChange = (field) => {
        // Toggle the sorting order for the selected field
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);
        setCurrentPage(1); // Reset to first page when sorting changes
        // The useEffect will handle fetching the sorted products
        handleSortMenuClose();
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUserId(null);
        setHasPurchased(false);
    };

    const handleLoginRedirect = () => {
        const sessionId = getSessionId(); // Ensure sessionId exists
        window.location.href = `/login?sessionId=${sessionId}`;
    };

    return (
        <div>
            {/* Navbar */}
            <AppBar position="fixed" sx={{ backgroundColor: '#151823' }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Left Section: Home, Popular */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button color="inherit" onClick={scrollToTop}>Home</Button>
                        <Button color="inherit" href="#popular-section">Popular</Button>
                        {/* Removed About Button */}
                    </Box>

                    {/* Middle Section: Search Bar */}
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                        <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Search www.N308.com.tr"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    console.log("Enter pressed. Executing search.");
                                    handleSearch();
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            edge="end"
                                            color="inherit"
                                            onClick={() => {
                                                console.log("Search button clicked. Executing search.");
                                                handleSearch();
                                            }}
                                        >
                                            <SearchIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                width: '50%',
                                backgroundColor: 'white', // Set background to white
                                borderRadius: '4px',
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#f3a847',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#ec9c33',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#ec9c33',
                                    },
                                },
                                input: {
                                    color: 'black', // Set input text color to black
                                },
                                '::placeholder': {
                                    color: 'gray', // Placeholder text color
                                }
                            }}
                        />
                    </Box>

                    {/* Right Section: Categories, Sort By, Cart, Login/Logout */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Category Dropdown */}
                        <Button
                            color="inherit"
                            startIcon={<SortIcon />}
                            onClick={handleCategoryMenuOpen}
                        >
                            Categories
                        </Button>
                        <Menu
                            anchorEl={anchorElCategory}
                            open={openCategory}
                            onClose={handleCategoryMenuClose}
                        >
                            {categories.map((category) => (
                                <MenuItem
                                    key={category._id}
                                    selected={activeCategory === category._id}
                                    onClick={() => handleCategoryClick(category._id)}
                                >
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Menu>

                        {/* Sort By Dropdown */}
                        <Button
                            color="inherit"
                            startIcon={<SortIcon />}
                            onClick={handleSortMenuOpen}
                        >
                            Sort By
                        </Button>
                        <Menu
                            anchorEl={anchorElSort}
                            open={openSort}
                            onClose={handleSortMenuClose}
                        >
                            <MenuItem onClick={() => handleSortChange('price')}>
                                Price {sortBy === 'price' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                            </MenuItem>
                            <MenuItem onClick={() => handleSortChange('popularity')}>
                                Popularity {sortBy === 'popularity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                            </MenuItem>
                            <MenuItem onClick={() => handleSortChange('averageRating')}>
                                Rating {sortBy === 'averageRating' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                            </MenuItem>
                        </Menu>

                        {/* Cart Button */}
                        <Tooltip title="View Cart">
                            <IconButton color="inherit" onClick={toggleCart}>
                                <Badge badgeContent={cartItems.length} color="secondary">
                                    <ShoppingCartIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        {/* Login/Logout Button */}
                        {isLoggedIn ? (
                            <Button
                                color="inherit"
                                startIcon={<AccountCircle />}
                                onClick={handleLogout}
                            >
                                Log Out
                            </Button>
                        ) : (
                            <Button
                                color="inherit"
                                startIcon={<AccountCircle />}
                                onClick={handleLoginRedirect}
                            >
                                Log In
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Spacer to prevent content from being hidden behind the AppBar */}
            <Toolbar />

            {/* Cart Panel */}
            {cartOpen && (
                <div className="cart-panel">
                    <IconButton className="close-cart" onClick={closeCart}>
                        <ArrowBackIcon />
                    </IconButton>
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
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleDecreaseQuantity(index)}
                                        >
                                            -
                                        </Button>
                                        <span className="quantity">{item.quantity}</span>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleIncreaseQuantity(index)}
                                        >
                                            +
                                        </Button>
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
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCheckout}
                            fullWidth
                        >
                            Proceed to Checkout
                        </Button>
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
                        <Typography variant="h4" gutterBottom>Popular Products</Typography>

                        <p style={{ fontSize: "1.5em" }}>Check out some of our most popular items.</p>

                        {products.length > 0 ? (
                            <div className="product-grid">
                                {products.map((product) => (
                                    <div
                                        className="product-card"
                                        key={product._id}
                                        onClick={() => handleProductClick(product)} // Handle product click
                                    >
                                        <img src={product.imageUrl} alt={product.name} className="product-image" />
                                        <Typography variant="h6" className="product-name">{product.name}</Typography>
                                        <Typography variant="body1" className="product-price">${product.price}</Typography>
                                        <div className="product-rating">
                                            <Rating
                                                name="read-only"
                                                value={product.averageRating}
                                                precision={0.5}
                                                readOnly
                                            />
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                {product.averageRating.toFixed(1)}
                                            </Typography>
                                        </div>

                                        {/* Add to Cart Button */}
                                        <Button
                                            variant="contained"
                                            color="secondary"
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
                                            fullWidth
                                        >
                                            {hasPurchased
                                                ? 'Already Purchased'
                                                : product.quantityInStock === 0
                                                    ? 'Out of Stock'
                                                    : 'Add to Cart'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Typography variant="h6">No products found matching your search.</Typography>
                        )}

                        {/* Hide pagination controls when there are no products */}
                        {products.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4, gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={goToPrevPage}
                                    disabled={isSearching ? searchCurrentPage === 1 : currentPage === 1}
                                >
                                    &laquo; Prev
                                </Button>
                                <Typography variant="body1">
                                    Page {isSearching ? searchCurrentPage : currentPage} of {isSearching ? searchTotalPages : totalPages}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={goToNextPage}
                                    disabled={isSearching ? searchCurrentPage === searchTotalPages : currentPage === totalPages}
                                >
                                    Next &raquo;
                                </Button>
                            </Box>
                        )}
                    </>
                ) : (

                    <Box sx={{ padding: 4 }}>
                        <Button
                            variant="contained"
                            onClick={handleBackToProducts}
                            startIcon={<ArrowBackIcon />}
                            sx={{
                                padding: '10px 15px',
                                fontSize: '1em',
                                backgroundColor: '#f3a847',
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: '#ec9c33',
                                },
                                marginBottom: '20px',
                            }}
                        >
                            Back to Products
                        </Button>

                        <Grid container spacing={4}>
                            {/* Product Image */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                                </Box>
                            </Grid>

                            {/* Product Information */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h4" gutterBottom>{selectedProduct.name}</Typography>
                                <Typography variant="h5" color="#28a745" gutterBottom>${selectedProduct.price.toFixed(2)}</Typography>

                                {/* Rating */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                    <Rating
                                        name="read-only"
                                        value={selectedProduct.averageRating}
                                        precision={0.5}
                                        readOnly
                                    />
                                    <Typography variant="body1" sx={{ ml: 1 }}>
                                        {selectedProduct.averageRating.toFixed(1)}
                                    </Typography>
                                </Box>

                                <Typography variant="body1" paragraph>{selectedProduct.description}</Typography>

                                {/* Quantity in Stock */}
                                <Typography variant="body1" sx={{ color: '#a94442', mb: 2 }}>
                                    There are {selectedProduct.quantityInStock} products left in stock.
                                </Typography>

                                {/* Product Details in Two Columns */}
                                <Grid container spacing={1}>
                                    <Grid item xs={4}>
                                        <Typography variant="body2" fontWeight="bold">Model</Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="body2">{selectedProduct.model}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="body2" fontWeight="bold">Serial Number</Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="body2">{selectedProduct.serialNumber}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="body2" fontWeight="bold">Warranty Status</Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="body2">{selectedProduct.warrantyStatus ? 'Valid' : 'Expired'}</Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="body2" fontWeight="bold">Distributor</Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="body2">{selectedProduct.distributor}</Typography>
                                    </Grid>
                                </Grid>

                                {/* Add to Cart Button */}
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => handleAddToCart(selectedProduct)}
                                    className="add-to-cart-button-detail"
                                    sx={{ mt: 2, padding: '6px 12px' }}
                                    disabled={selectedProduct.quantityInStock === 0} // Disable if out of stock
                                >
                                    {selectedProduct.quantityInStock === 0
                                        ? 'Out of Stock' // Display when unavailable
                                        : 'Add to Cart'}  
                                </Button>
                            </Grid>
                        </Grid>

                        {/* Comments Section */}
                        {isAddingComment ? (
                            <Box sx={{ mt: 4 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => setIsAddingComment(false)}
                                    startIcon={<ArrowBackIcon />}
                                    sx={{
                                        padding: '10px 15px',
                                        fontSize: '1em',
                                        backgroundColor: '#f3a847',
                                        color: '#fff',
                                        '&:hover': {
                                            backgroundColor: '#ec9c33',
                                        },
                                        marginBottom: '20px',
                                    }}
                                >
                                    Back
                                </Button>
                                {/* Rating Input */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1">Rating:</Typography>
                                    <Rating
                                        name="new-rating"
                                        value={parseFloat(newRating)}
                                        precision={0.5}
                                        onChange={(event, newValue) => {
                                            setNewRating(newValue);
                                        }}
                                    />
                                </Box>
                                {/* Comment Input */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1">Comment:</Typography>
                                    <TextField
                                        multiline
                                        rows={4}
                                        variant="outlined"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        fullWidth
                                    />
                                </Box>
                                {/* Submit Button */}
                                <Button
                                    variant="contained"
                                    onClick={handleSubmitComment}
                                    sx={{
                                        padding: '10px 15px',
                                        fontSize: '1em',
                                        backgroundColor: '#28a745',
                                        color: '#fff',
                                        '&:hover': {
                                            backgroundColor: '#218838',
                                        },
                                        marginTop: '10px',
                                    }}
                                >
                                    Submit
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ mt: 4 }}>
                                {/* Add Comment/Rating Button */}
                                <Button
                                    variant="outlined"
                                    onClick={handleAddCommentClick}
                                    disabled={!(userId && hasPurchased)}
                                    title={
                                        !userId
                                            ? 'Please log in to add a comment or rating'
                                            : !hasPurchased
                                                ? 'You have not purchased this product, so you cannot comment or rate it'
                                                : ''
                                    }
                                    sx={{
                                        mb: 2,
                                        textTransform: 'none',
                                    }}
                                >
                                    Add Comment/Rating
                                </Button>

                                {/* Comments List */}
                                <Box>
                                    {comments.length > 0 ? (
                                        comments.map((comment, index) => (
                                            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="subtitle2" component="span">
                                                        <strong>{userMap[comment.user] || 'Anonymous'}</strong>
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown Date'}
                                                    </Typography>
                                                </Box>
                                                {/* Rating */}
                                                {comment.rating && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Rating
                                                            name={`rating-${index}`}
                                                            value={comment.rating}
                                                            precision={0.5}
                                                            readOnly
                                                        />
                                                        <Typography variant="body2" sx={{ ml: 1 }}>
                                                            {comment.rating.toFixed(1)}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {/* Comment Content */}
                                                {comment.content && (
                                                    <Typography variant="body1">
                                                        {comment.content}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="body1">No comments available for this product yet.</Typography>
                                    )}
                                </Box>

                                {/* Comments Pagination */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handlePrevCommentsPage}
                                        disabled={commentsPage <= 1}
                                    >
                                        &laquo; Prev
                                    </Button>
                                    <Typography variant="body2">
                                        Page {commentsPage} of {commentsTotalPages}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        onClick={handleNextCommentsPage}
                                        disabled={commentsPage >= commentsTotalPages}
                                    >
                                        Next &raquo;
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>

                )}
            </div>


            {/* Footer */}
            <footer className="footer">
                <Box sx={{ maxWidth: '1200px', margin: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Divider sx={{ width: '100%', mb: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                        &copy; {new Date().getFullYear()} N308 E-Commerce Platform. All rights reserved.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <IconButton href="#" color="inherit">
                            {/* Replace with MUI Icons or keep Remix Icons */}
                            <i className="ri-facebook-circle-line"></i>
                        </IconButton>
                        <IconButton href="#" color="inherit">
                            <i className="ri-instagram-line"></i>
                        </IconButton>
                        <IconButton href="#" color="inherit">
                            <i className="ri-twitter-line"></i>
                        </IconButton>
                        <IconButton href="#" color="inherit">
                            <i className="ri-linkedin-line"></i>
                        </IconButton>
                    </Box>
                </Box>
            </footer>

            {/* Back to Top Button */}
            <button id="backToTopBtn" onClick={scrollToTop}>
                <i className="ri-arrow-up-s-line"></i>
            </button>
        </div>
    );

};

export default MainPage;
