// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * PrivateRoute component to protect routes based on user roles.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - The component to render if access is granted.
 * @param {Array<string>} props.allowedRoles - Roles permitted to access the route.
 * @returns {React.ReactNode} - The rendered component or a redirect.
 */
const PrivateRoute = ({ children, allowedRoles }) => {
    const userId = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    console.log('PrivateRoute - userId:', userId);
    console.log('PrivateRoute - role:', role);
    console.log('PrivateRoute - allowedRoles:', allowedRoles);

    // If the user is not logged in, redirect to the login page.
    if (!userId) {
        return <Navigate to='/login' replace />;
    }

    // If the user's role is not allowed, redirect to the unauthorized page.
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to='/unauthorized' replace />;
    }

    // If access is granted, render the child component.
    return children;
};

export default PrivateRoute;
