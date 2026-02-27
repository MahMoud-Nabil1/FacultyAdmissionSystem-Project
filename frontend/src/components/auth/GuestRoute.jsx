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
    const { isAuthenticated, loading } = useAuth();

    // Wait until auth state is loaded from localStorage
    if (loading) return null;

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default GuestRoute;
