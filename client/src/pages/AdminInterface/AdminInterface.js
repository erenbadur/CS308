// src/pages/AdminInterface/AdminInterface.js
import React, { useState, useEffect } from 'react';
import './AdminInterface.css';

/**
 * AdminInterface component representing the admin dashboard.
 *
 * Displays a sidebar with navigation buttons based on user roles.
 * Includes a submenu for Product Manager to manage categories, products, comments, and deliveries.
 */
const AdminInterface = () => {
    // Retrieve the user's role from localStorage
    const role = localStorage.getItem('role') || 'customer'; // Default to 'customer' if not found

    // State to manage the active section in the sidebar
    const [activeSection, setActiveSection] = useState('');
    // State to manage the active content in the main area
    const [activeContent, setActiveContent] = useState('dashboard');

    // State to manage categories
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [deleteCategory, setDeleteCategory] = useState('');

    // State to manage products
    const [products, setProducts] = useState([]);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
    const [newProduct, setNewProduct] = useState({
        name: '',
        model: '',
        serialNumber: '',
        description: '',
        category: '',
        quantityInStock: 0,
        price: 0,
        distributor: '',
        warrantyStatus: true,
        imageUrl: '',
    });

    // State for update modal
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [productToUpdate, setProductToUpdate] = useState(null);
    const [updateFields, setUpdateFields] = useState({
        name: '',
        model: '',
        serialNumber: '',
        description: '',
        category: '',
        quantityInStock: 0,
        price: 0,
        distributor: '',
        warrantyStatus: true,
        imageUrl: '',
    });

    // State for Manage Comments
    const [comments, setComments] = useState([]);
    const [filterApproved, setFilterApproved] = useState('all'); // 'all', 'approved', 'disapproved'
    const [sortByComments, setSortByComments] = useState('createdAt');
    const [orderComments, setOrderComments] = useState('desc'); // 'asc' veya 'desc'

    // State for Manage Deliveries
    const [deliveries, setDeliveries] = useState([]);
    const [sortByDeliveries, setSortByDeliveries] = useState('purchaseDate');
    const [orderDeliveries, setOrderDeliveries] = useState('desc'); // 'asc' veya 'desc'

    // State for loading and messages
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch all deliveries when activeContent changes to 'manageDeliveries'
    useEffect(() => {
        if (activeContent === 'manageDeliveries') {
            fetchDeliveries();
        }
    }, [activeContent, sortByDeliveries, orderDeliveries]);

    // Fetch all categories on component mount or when activeContent changes to 'manageCategories' or 'manageProducts'
    useEffect(() => {
        if (activeContent === 'manageCategories' || activeContent === 'manageProducts') {
            fetchCategories();
        }
        if (activeContent === 'manageProducts') {
            fetchProducts();
        }
        if (activeContent === 'manageComments') {
            fetchComments();
        }
    }, [activeContent, filterApproved, sortByComments, orderComments]);

    /**
     * Fetches all deliveries from the backend with current sorting.
     */
    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            let url = '/api/manager/deliveries?';
            url += `sortBy=${sortByDeliveries}&order=${orderDeliveries}`;

            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) {
                setDeliveries(data.deliveries);
                setErrorMessage('');
            } else {
                setErrorMessage(data.error || 'Failed to fetch deliveries.');
            }
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            setErrorMessage('An error occurred while fetching deliveries.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetches all categories from the backend.
     */
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/manager/categories');
            const data = await response.json();
            if (response.ok) {
                setCategories(data.categories);
                setErrorMessage('');
            } else {
                setErrorMessage(data.error || 'Failed to fetch categories.');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setErrorMessage('An error occurred while fetching categories.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetches all products from the backend.
     */
    const fetchProducts = async () => {
        setLoading(true);
        try {
            let url = '/api/manager/products';
            if (selectedCategoryFilter) {
                url += `?category=${selectedCategoryFilter}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) {
                setProducts(data.products);
                setErrorMessage('');
            } else {
                setErrorMessage(data.error || 'Failed to fetch products.');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setErrorMessage('An error occurred while fetching products.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetches all comments from the backend with current filters and sorting.
     */
    const fetchComments = async () => {
        setLoading(true);
        try {
            let url = '/api/manager/comments?';

            if (filterApproved === 'approved') {
                url += `approved=true&`;
            } else if (filterApproved === 'disapproved') {
                url += `approved=false&`;
            }

            url += `sortBy=${sortByComments}&order=${orderComments}`;

            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) {
                setComments(data.comments);
                setErrorMessage('');
            } else {
                setErrorMessage(data.error || 'Failed to fetch comments.');
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            setErrorMessage('An error occurred while fetching comments.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles navigation button clicks.
     *
     * @param {string} section - The section to toggle.
     */
    const handleNavClick = (section) => {
        if (role === section) {
            setActiveSection(activeSection === section ? '' : section);
            setActiveContent('dashboard'); // Reset main content to dashboard when toggling sidebar section
        }
    };

    /**
     * Handles clicking on submenu items.
     *
     * @param {string} content - The content to display.
     */
    const handleSubMenuClick = (content) => {
        setActiveContent(content);
    };

    /**
     * Handles adding a new category.
     *
     * @param {Event} e - The form submission event.
     */
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) {
            setErrorMessage('Category name cannot be empty.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/manager/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategory.trim() }),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Category added successfully.');
                setNewCategory('');
                fetchCategories();
            } else {
                setErrorMessage(data.error || 'Failed to add category.');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            setErrorMessage('An error occurred while adding the category.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles deleting a category.
     *
     * @param {Event} e - The form submission event.
     */
    const handleDeleteCategory = async (e) => {
        e.preventDefault();
        if (!deleteCategory) {
            setErrorMessage('Please select a category to delete.');
            return;
        }

        const categoryName = getCategoryNameById(deleteCategory);
        const confirmDeletion = window.confirm(`Are you sure you want to delete the category "${categoryName}"? This will also delete all associated products.`);
        if (!confirmDeletion) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/manager/categories/${encodeURIComponent(categoryName)}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage(data.message);
                setDeleteCategory('');
                fetchCategories();
                if (activeContent === 'manageProducts') {
                    fetchProducts(); // Update product list if 'manageProducts' is active
                }
            } else {
                setErrorMessage(data.error || 'Failed to delete category.');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            setErrorMessage('An error occurred while deleting the category.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles input changes for the new product form.
     *
     * @param {Object} e - The event object.
     */
    const handleProductInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'warrantyStatus') {
            setNewProduct(prevState => ({
                ...prevState,
                [name]: checked,
            }));
        } else if (name === 'category') {
            setNewProduct(prevState => ({
                ...prevState,
                [name]: value,
            }));
        } else {
            setNewProduct(prevState => ({
                ...prevState,
                [name]: type === 'number' ? Number(value) : value,
            }));
        }
    };

    /**
     * Handles adding a new product.
     *
     * @param {Event} e - The form submission event.
     */
    const handleAddProduct = async (e) => {
        e.preventDefault();

        // Destructure newProduct
        const {
            name,
            model,
            serialNumber,
            description,
            category,
            quantityInStock,
            price,
            distributor,
            warrantyStatus,
            imageUrl,
        } = newProduct;

        // Basic validation
        if (!name.trim() || !model.trim() || !serialNumber.trim() || !category || quantityInStock < 0 || price < 0 || !distributor.trim() || !imageUrl.trim()) {
            setErrorMessage('Please fill in all required fields correctly.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/createProduct/product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    model: model.trim(),
                    serialNumber: serialNumber.trim(),
                    description: description.trim(),
                    category,
                    quantityInStock,
                    price,
                    distributor: distributor.trim(),
                    warrantyStatus,
                    imageUrl: imageUrl.trim(),
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Product added successfully.');
                setNewProduct({
                    name: '',
                    model: '',
                    serialNumber: '',
                    description: '',
                    category: '',
                    quantityInStock: 0,
                    price: 0,
                    distributor: '',
                    warrantyStatus: true,
                    imageUrl: '',
                });
                fetchProducts();
            } else {
                setErrorMessage(data.error || 'Failed to add product.');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            setErrorMessage('An error occurred while adding the product.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles deleting a product.
     *
     * @param {string} productId - The ID of the product to delete.
     */
    const handleDeleteProduct = async (productId) => {
        const confirmDeletion = window.confirm('Are you sure you want to delete this product?');
        if (!confirmDeletion) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/manager/products/${encodeURIComponent(productId)}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Product deleted successfully.');
                fetchProducts();
            } else {
                setErrorMessage(data.error || 'Failed to delete product.');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            setErrorMessage('An error occurred while deleting the product.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Opens the update modal for a specific product.
     *
     * @param {Object} product - The product to update.
     */
    const openUpdateModal = (product) => {
        setProductToUpdate(product);
        setUpdateFields({
            name: product.name,
            model: product.model,
            serialNumber: product.serialNumber,
            description: product.description,
            category: product.category ? product.category._id : '',
            quantityInStock: product.quantityInStock,
            price: product.price,
            distributor: product.distributor,
            warrantyStatus: product.warrantyStatus,
            imageUrl: product.imageUrl,
        });
        setIsUpdateModalOpen(true);
    };

    /**
     * Closes the update modal.
     */
    const closeUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setProductToUpdate(null);
        setUpdateFields({
            name: '',
            model: '',
            serialNumber: '',
            description: '',
            category: '',
            quantityInStock: 0,
            price: 0,
            distributor: '',
            warrantyStatus: true,
            imageUrl: '',
        });
    };

    /**
     * Handles input changes for the update product form.
     *
     * @param {Object} e - The event object.
     */
    const handleUpdateInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'warrantyStatus') {
            setUpdateFields(prevState => ({
                ...prevState,
                [name]: checked,
            }));
        } else if (name === 'category') {
            setUpdateFields(prevState => ({
                ...prevState,
                [name]: value,
            }));
        } else {
            setUpdateFields(prevState => ({
                ...prevState,
                [name]: type === 'number' ? Number(value) : value,
            }));
        }
    };

    /**
     * Handles updating a product.
     *
     * @param {Event} e - The form submission event.
     */
    const handleUpdateProduct = async (e) => {
        e.preventDefault();

        const { productId } = productToUpdate;
        const {
            name,
            model,
            serialNumber,
            description,
            category,
            quantityInStock,
            price,
            distributor,
            warrantyStatus,
            imageUrl,
        } = updateFields;

        // Basic validation
        if (!name.trim() || !model.trim() || !serialNumber.trim() || !category || quantityInStock < 0 || price < 0 || !distributor.trim() || !imageUrl.trim()) {
            setErrorMessage('Please fill in all required fields correctly.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/manager/products/${encodeURIComponent(productId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    model: model.trim(),
                    serialNumber: serialNumber.trim(),
                    description: description.trim(),
                    category,
                    quantityInStock,
                    price,
                    distributor: distributor.trim(),
                    warrantyStatus,
                    imageUrl: imageUrl.trim(),
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Product updated successfully.');
                closeUpdateModal();
                fetchProducts();
            } else {
                setErrorMessage(data.error || 'Failed to update product.');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            setErrorMessage('An error occurred while updating the product.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles approving a comment.
     *
     * @param {string} productId - The ID of the product.
     * @param {string} commentId - The ID of the comment.
     */
    const handleApproveComment = async (productId, commentId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/manager/comments/${encodeURIComponent(productId)}/${encodeURIComponent(commentId)}/approve`, {
                method: 'PUT',
            });
            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Comment approved successfully.');
                fetchComments();
            } else {
                setErrorMessage(data.error || 'Failed to approve comment.');
            }
        } catch (error) {
            console.error('Error approving comment:', error);
            setErrorMessage('An error occurred while approving the comment.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles disapproving a comment.
     *
     * @param {string} productId - The ID of the product.
     * @param {string} commentId - The ID of the comment.
     */
    const handleDisapproveComment = async (productId, commentId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/manager/comments/${encodeURIComponent(productId)}/${encodeURIComponent(commentId)}/disapprove`, {
                method: 'PUT',
            });
            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Comment disapproved successfully.');
                fetchComments();
            } else {
                setErrorMessage(data.error || 'Failed to disapprove comment.');
            }
        } catch (error) {
            console.error('Error disapproving comment:', error);
            setErrorMessage('An error occurred while disapproving the comment.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles deleting a comment.
     *
     * @param {string} productId - The ID of the product.
     * @param {string} commentId - The ID of the comment.
     */
    const handleDeleteComment = async (productId, commentId) => {
        const confirmDeletion = window.confirm('Are you sure you want to delete this comment?');
        if (!confirmDeletion) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/manager/comments/${encodeURIComponent(productId)}/${encodeURIComponent(commentId)}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Comment deleted successfully.');
                fetchComments();
            } else {
                setErrorMessage(data.error || 'Failed to delete comment.');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            setErrorMessage('An error occurred while deleting the comment.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles changing the approval filter.
     *
     * @param {Event} e - The change event.
     */
    const handleFilterChange = (e) => {
        setFilterApproved(e.target.value);
    };
/**
 * Handles changing the sort field for deliveries.
 *
 * @param {Event} e - The change event.
 */
const handleSortByDeliveriesChange = (e) => {
    setSortByDeliveries(e.target.value);
};

/**
 * Handles changing the sort order for deliveries.
 *
 * @param {Event} e - The change event.
 */
const handleOrderDeliveriesChange = (e) => {
    setOrderDeliveries(e.target.value);
};

    /**
     * Handles changing the sort field for comments.
     *
     * @param {Event} e - The change event.
     */
    const handleSortByChange = (e) => {
        setSortByComments(e.target.value);
    };

    /**
     * Handles changing the sort order for comments.
     *
     * @param {Event} e - The change event.
     */
    const handleOrderChange = (e) => {
        setOrderComments(e.target.value);
    };

    /**
     * Gets category name by its ID.
     *
     * @param {string} categoryId - The ID of the category.
     * @returns {string} - The name of the category.
     */
    const getCategoryNameById = (categoryId) => {
        const category = categories.find(cat => cat._id === categoryId);
        return category ? category.name : '';
    };

    /**
     * Clears success and error messages after a timeout.
     */
    useEffect(() => {
        if (errorMessage || successMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
                setSuccessMessage('');
            }, 5000); // Clear messages after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [errorMessage, successMessage]);

    /**
     * Handles logout by clearing localStorage and redirecting to login.
     */
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login'; // Adjust the route as per your routing setup
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <div className="sidebar">
                <h2 className="sidebar-title">N308 Admin Panel</h2>
                <p className="welcome-message">Welcome, Your Role: {role}</p>
                <div className="nav-buttons">
                    {/* Sales Manager Button */}
                    <button
                        className={`nav-button ${role === 'salesManager' ? 'active' : 'secondary'}`}
                        onClick={() => handleNavClick('salesManager')}
                        disabled={role !== 'salesManager'}
                        title={role === 'salesManager' ? '' : 'You do not have permission to access this section'}
                    >
                        Sales Manager
                    </button>
                    {/* Collapsible Content for Sales Manager */}
                    {role === 'salesManager' && activeSection === 'salesManager' && (
                        <div className="collapse-content">
                            {/* Add Sales Manager related content here */}
                            <p>Sales Manager Dashboard</p>
                        </div>
                    )}

                    {/* Product Manager Button */}
                    <button
                        className={`nav-button ${role === 'productManager' ? 'active' : 'secondary'}`}
                        onClick={() => handleNavClick('productManager')}
                        disabled={role !== 'productManager'}
                        title={role !== 'productManager' ? 'You do not have permission to access this section' : ''}
                    >
                        Product Manager
                    </button>
                    {/* Submenu for Product Manager */}
                    {role === 'productManager' && activeSection === 'productManager' && (
                        <div className="submenu">
                            <button
                                className={`nav-button submenu-button ${activeContent === 'manageCategories' ? 'active' : 'secondary'}`}
                                onClick={() => handleSubMenuClick('manageCategories')}
                                disabled={activeContent === 'manageCategories'}
                                title={activeContent === 'manageCategories' ? 'Manage Categories is active' : ''}
                            >
                                Manage Categories
                            </button>
                            <button
                                className={`nav-button submenu-button ${activeContent === 'manageProducts' ? 'active' : 'secondary'}`}
                                onClick={() => handleSubMenuClick('manageProducts')}
                                disabled={activeContent === 'manageProducts'}
                                title={activeContent === 'manageProducts' ? 'Manage Products is active' : ''}
                            >
                                Manage Products
                            </button>
                            {/* Manage Comments Button */}
                            <button
                                className={`nav-button submenu-button ${activeContent === 'manageComments' ? 'active' : 'secondary'}`}
                                onClick={() => handleSubMenuClick('manageComments')}
                                disabled={activeContent === 'manageComments'}
                                title={activeContent === 'manageComments' ? 'Manage Comments is active' : ''}
                            >
                                Manage Comments
                            </button>

                            {/* Manage Deliveries Button */}
                            <button
                                className={`nav-button submenu-button ${activeContent === 'manageDeliveries' ? 'active' : 'secondary'}`}
                                onClick={() => handleSubMenuClick('manageDeliveries')}
                                disabled={activeContent === 'manageDeliveries'}
                                title={activeContent === 'manageDeliveries' ? 'Manage Deliveries is active' : ''}
                            >
                                Manage Deliveries
                            </button>
                        </div>
                    )}
                </div>
                {/* Logout Button */}
                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
            {/* Main Content Area */}
            <div className="main-content">
                {activeContent === 'dashboard' && (
                    <div className="dashboard-content">
                        <h3>Dashboard Content</h3>
                        <p>Select a section from the sidebar to view details.</p>
                    </div>
                )}
                {activeContent === 'manageCategories' && (
                    <div className="manage-categories">
                        <h3>Manage Categories</h3>
                        {/* Add Category Form */}
                        <form onSubmit={handleAddCategory} className="category-form">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="New Category Name"
                                required
                            />
                            <button type="submit" disabled={loading}>Add Category</button>
                        </form>

                        {/* Delete Category Form */}
                        <form onSubmit={handleDeleteCategory} className="category-form delete-form">
                            <select
                                value={deleteCategory}
                                onChange={(e) => setDeleteCategory(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select Category to Delete</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                            <button type="submit" disabled={loading}>Delete Category</button>
                        </form>

                        {/* Display Success and Error Messages */}
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        {successMessage && <p className="success-message">{successMessage}</p>}

                        {/* List of Categories */}
                        <div className="existing-categories">
                            <h4>Existing Categories:</h4>
                            {loading ? (
                                <p>Loading categories...</p>
                            ) : (
                                <ul>
                                    {categories.map((cat) => (
                                        <li key={cat._id}>{cat.name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
                {activeContent === 'manageProducts' && (
                    <div className="manage-products">
                        <h3>Manage Products</h3>

                        {/* Add Product Form */}
                        <form onSubmit={handleAddProduct} className="product-form">
                            <h4>Add New Product</h4>
                            <div className="form-group">
                                <label>Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newProduct.name}
                                    onChange={handleProductInputChange}
                                    placeholder="Product Name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Model:</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={newProduct.model}
                                    onChange={handleProductInputChange}
                                    placeholder="Model"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Serial Number:</label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    value={newProduct.serialNumber}
                                    onChange={handleProductInputChange}
                                    placeholder="Serial Number"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    name="description"
                                    value={newProduct.description}
                                    onChange={handleProductInputChange}
                                    placeholder="Product Description"
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Category:</label>
                                <select
                                    name="category"
                                    value={newProduct.category}
                                    onChange={handleProductInputChange}
                                    required
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Quantity In Stock:</label>
                                <input
                                    type="number"
                                    name="quantityInStock"
                                    value={newProduct.quantityInStock}
                                    onChange={handleProductInputChange}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Price:</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={newProduct.price}
                                    onChange={handleProductInputChange}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Distributor:</label>
                                <input
                                    type="text"
                                    name="distributor"
                                    value={newProduct.distributor}
                                    onChange={handleProductInputChange}
                                    placeholder="Distributor Name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Warranty Status:</label>
                                <input
                                    type="checkbox"
                                    name="warrantyStatus"
                                    checked={newProduct.warrantyStatus}
                                    onChange={handleProductInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Image URL:</label>
                                <input
                                    type="url"
                                    name="imageUrl"
                                    value={newProduct.imageUrl}
                                    onChange={handleProductInputChange}
                                    placeholder="https://example.com/image.jpg"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading}>Add Product</button>
                        </form>

                        {/* Display Success and Error Messages */}
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        {successMessage && <p className="success-message">{successMessage}</p>}

                        {/* Filter Products by Category */}
                        <div className="filter-products">
                            <label>Filter by Category:</label>
                            <select
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                            <button onClick={fetchProducts} disabled={loading}>Apply Filter</button>
                        </div>

                        {/* List of Products */}
                        <div className="product-list">
                            <h4>Existing Products:</h4>
                            {loading ? (
                                <p>Loading products...</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Name</th>
                                            <th>Model</th>
                                            <th>Serial Number</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Distributor</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length > 0 ? (
                                            products.map((product) => (
                                                <tr key={product.productId}>
                                                    <td>
                                                        <img src={product.imageUrl} alt={product.name} width="50" height="50" />
                                                    </td>
                                                    <td>{product.name}</td>
                                                    <td>{product.model}</td>
                                                    <td>{product.serialNumber}</td>
                                                    <td>{product.category ? product.category.name : 'N/A'}</td>
                                                    <td>${product.price.toFixed(2)}</td>
                                                    <td>{product.quantityInStock}</td>
                                                    <td>{product.distributor}</td>
                                                    <td>
                                                        <button onClick={() => handleDeleteProduct(product.productId)} disabled={loading}>
                                                            Delete
                                                        </button>
                                                        <button onClick={() => openUpdateModal(product)} disabled={loading}>
                                                            Update
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9">No products found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
                {activeContent === 'manageComments' && (
                    <div className="manage-comments">
                        <h3>Manage Comments</h3>

                        <div className="filter-sort-controls">
                            <div className="filter-group">
                                <label>Approval Status:</label>
                                <select value={filterApproved} onChange={handleFilterChange}>
                                    <option value="all">All</option>
                                    <option value="approved">Approved</option>
                                    <option value="disapproved">Disapproved</option>
                                </select>
                            </div>
                            <div className="sort-group">
                                <label>Sort By:</label>
                                <select value={sortByComments} onChange={handleSortByChange}>
                                    <option value="createdAt">Creation Date</option>
                                </select>
                                <select value={orderComments} onChange={handleOrderChange}>
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </select>
                            </div>
                        </div>

                        {/* Display Success and Error Messages */}
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        {successMessage && <p className="success-message">{successMessage}</p>}

                        <div className="comments-list">
                            {loading ? (
                                <p>Loading comments...</p>
                            ) : comments.length > 0 ? (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>User</th>
                                            <th>Content</th>
                                            <th>Approved</th>
                                            <th>Created At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comments.map(comment => (
                                            <tr key={comment.commentId}>
                                                <td>{comment.productName}</td>
                                                <td>{comment.user}</td>
                                                <td>{comment.content}</td>
                                                <td>{comment.approved ? 'Yes' : 'No'}</td>
                                                <td>{new Date(comment.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleApproveComment(comment.productId, comment.commentId)}
                                                        disabled={loading || comment.approved}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleDisapproveComment(comment.productId, comment.commentId)}
                                                        disabled={loading || !comment.approved}
                                                    >
                                                        Disapprove
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.productId, comment.commentId)}
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No comments found.</p>
                            )}
                        </div>
                    </div>
                )}
                {activeContent === 'manageDeliveries' && (
                    <div className="manage-deliveries">
                        <h3>Manage Deliveries</h3>

                        {/* Sort Controls */}
                        <div className="filter-sort-controls">
                            <div className="sort-group">
                                <label>Sort By:</label>
                                <select value={sortByDeliveries} onChange={handleSortByDeliveriesChange}>
                                    <option value="purchaseDate">Purchase Date</option>
                                    {/* Add more sorting options if needed */}
                                </select>
                                <select value={orderDeliveries} onChange={handleOrderDeliveriesChange}>
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </select>
                            </div>
                        </div>

                        {/* Display Success and Error Messages */}
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        {successMessage && <p className="success-message">{successMessage}</p>}

                        {/* Deliveries List */}
                        <div className="deliveries-list">
                            {loading ? (
                                <p>Loading deliveries...</p>
                            ) : deliveries.length > 0 ? (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Delivery ID</th>
                                            <th>Customer ID</th>
                                            <th>Product ID</th>
                                            <th>Quantity</th>
                                            <th>Total Price</th>
                                            <th>Delivery Address</th>
                                            <th>Delivery Status</th>
                                            <th>Purchase Date</th>
                                            <th>Invoice ID</th>
                                            <th>Invoice Date</th>
                                            <th>Invoice Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveries.map(delivery => (
                                            <tr key={delivery.deliveryId}>
                                                <td>{delivery.deliveryId}</td>
                                                <td>{delivery.customerId}</td>
                                                <td>{delivery.productId}</td>
                                                <td>{delivery.quantity}</td>
                                                <td>${delivery.totalPrice.toFixed(2)}</td>
                                                <td>
                                                    {delivery.deliveryAddress.fullName}, {delivery.deliveryAddress.address}, {delivery.deliveryAddress.city || ''}, {delivery.deliveryAddress.country}, {delivery.deliveryAddress.postalCode}
                                                </td>
                                                <td>{delivery.deliveryStatus}</td>
                                                <td>{new Date(delivery.purchaseDate).toLocaleDateString()}</td>
                                                <td>{delivery.invoiceId}</td>
                                                <td>{delivery.invoiceDate !== 'N/A' ? new Date(delivery.invoiceDate).toLocaleDateString() : 'N/A'}</td>
                                                <td>${delivery.invoiceTotalAmount !== 'N/A' ? delivery.invoiceTotalAmount.toFixed(2) : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No deliveries found.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Update Product Modal */}
            {isUpdateModalOpen && productToUpdate && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Update Product</h3>
                        <form onSubmit={handleUpdateProduct} className="update-form">
                            <div className="form-group">
                                <label>Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={updateFields.name}
                                    onChange={handleUpdateInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Model:</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={updateFields.model}
                                    onChange={handleUpdateInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Serial Number:</label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    value={updateFields.serialNumber}
                                    onChange={handleUpdateInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    name="description"
                                    value={updateFields.description}
                                    onChange={handleUpdateInputChange}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Category:</label>
                                <select
                                    name="category"
                                    value={updateFields.category}
                                    onChange={handleUpdateInputChange}
                                    required
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Quantity In Stock:</label>
                                <input
                                    type="number"
                                    name="quantityInStock"
                                    value={updateFields.quantityInStock}
                                    onChange={handleUpdateInputChange}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Price:</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={updateFields.price}
                                    onChange={handleUpdateInputChange}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Distributor:</label>
                                <input
                                    type="text"
                                    name="distributor"
                                    value={updateFields.distributor}
                                    onChange={handleUpdateInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Warranty Status:</label>
                                <input
                                    type="checkbox"
                                    name="warrantyStatus"
                                    checked={updateFields.warrantyStatus}
                                    onChange={handleUpdateInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Image URL:</label>
                                <input
                                    type="url"
                                    name="imageUrl"
                                    value={updateFields.imageUrl}
                                    onChange={handleUpdateInputChange}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" disabled={loading}>Save Changes</button>
                                <button type="button" onClick={closeUpdateModal} disabled={loading}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

}

export default AdminInterface;
