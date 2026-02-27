import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * GuestRoute — wraps routes that should only be accessible to guests (not logged in).
 * If the user IS authenticated, they are redirected to /.
 *
 * Use this for /login, /register, /ForgotPassWord etc.
 */
const GuestRoute = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return null;

    if (isAuthenticated && user) {
        if (user.role) return <Navigate to="/admin-dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};
export default GuestRoute;
