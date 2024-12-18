// src/pages/AdminInterface/AdminInterface.js
import React, { useState, useEffect } from 'react';
import './AdminInterface.css';

/**
 * AdminInterface component representing the admin dashboard.
 *
 * Displays a sidebar with navigation buttons based on user roles.
 * Includes a submenu for Product Manager to manage categories.
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

    // State for loading and messages
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch all categories on component mount
    useEffect(() => {
        if (activeContent === 'manageCategories') {
            fetchCategories();
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

        const confirmDeletion = window.confirm(`Are you sure you want to delete the category "${deleteCategory}"? This will also delete all associated products.`);
        if (!confirmDeletion) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/manager/categories/${encodeURIComponent(deleteCategory)}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage(data.message);
                setDeleteCategory('');
                fetchCategories();
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
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
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
            </div>
        </div>
    );
}

    export default AdminInterface;
