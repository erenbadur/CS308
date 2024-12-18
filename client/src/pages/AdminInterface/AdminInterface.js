// src/pages/AdminInterface/AdminInterface.js
import React, { useState, useEffect } from 'react';
import './AdminInterface.css';

/**
 * AdminInterface component representing the admin dashboard.
 *
 * Displays a sidebar with navigation buttons based on user roles.
 * Includes a submenu for Product Manager to manage categories and products.
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
        discount: {
            percentage: 0,
            validUntil: '',
        },
        imageUrl: '',
    });

    // State for loading and messages
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch all categories on component mount or when activeContent changes to 'manageCategories' or 'manageProducts'
    useEffect(() => {
        if (activeContent === 'manageCategories' || activeContent === 'manageProducts') {
            fetchCategories();
        }
        if (activeContent === 'manageProducts') {
            fetchProducts();
        }
    }, [activeContent]);

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
        if (name.startsWith('discount.')) {
            const discountField = name.split('.')[1];
            setNewProduct(prevState => ({
                ...prevState,
                discount: {
                    ...prevState.discount,
                    [discountField]: discountField === 'percentage' ? Number(value) : value,
                },
            }));
        } else if (name === 'warrantyStatus') {
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
            discount,
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
                    discount,
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
                    discount: {
                        percentage: 0,
                        validUntil: '',
                    },
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
                        title={role !== 'salesManager' ? 'You do not have permission to access this section' : ''}
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
                        </div>
                    )}
                </div>
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
                                <label>Discount Percentage:</label>
                                <input
                                    type="number"
                                    name="discount.percentage"
                                    value={newProduct.discount.percentage}
                                    onChange={handleProductInputChange}
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div className="form-group">
                                <label>Discount Valid Until:</label>
                                <input
                                    type="date"
                                    name="discount.validUntil"
                                    value={newProduct.discount.validUntil}
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
            </div>
        </div>
    );
}
    export default AdminInterface;
