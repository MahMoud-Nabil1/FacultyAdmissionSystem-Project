import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps routes that require the user to be logged in.
 * If the user is NOT authenticated, they are redirected to /login.
 *
 * Optional `allowedRoles` prop can restrict access to specific roles.
 * Example: <ProtectedRoute allowedRoles={['staff']}><AdminPage /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Wait until auth state is loaded from localStorage
    if (loading) return null;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If specific roles are required, check the user's role
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
