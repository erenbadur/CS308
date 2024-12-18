// src/pages/AdminInterface/AdminInterface.js
import React, { useState } from 'react';
import './AdminInterface.css';

/**
 * AdminInterface component representing the admin dashboard.
 *
 * Displays a sidebar with navigation buttons based on user roles.
 * The sidebar includes collapsible sections for Sales Manager and Product Manager.
 */
const AdminInterface = () => {
    // Retrieve the user's role from localStorage
    const role = localStorage.getItem('role') || 'customer'; // Default to 'customer' if not found

    // State to manage the active section in the sidebar
    const [activeSection, setActiveSection] = useState('');

    /**
     * Handles navigation button clicks.
     *
     * @param {string} section - The section to toggle.
     */
    const handleNavClick = (section) => {
        if (role === section) {
            setActiveSection(activeSection === section ? '' : section);
        }
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
                    {/* Collapsible Content for Product Manager */}
                    {role === 'productManager' && activeSection === 'productManager' && (
                        <div className="collapse-content">
                            {/* Add Product Manager related content here */}
                            <p>Product Manager Dashboard</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Main Content Area */}
            <div className="main-content">
                {/* Future content will be displayed here */}
                <h3>Dashboard Content</h3>
                <p>Select a section from the sidebar to view details.</p>
            </div>
        </div>
    );
};

export default AdminInterface;
