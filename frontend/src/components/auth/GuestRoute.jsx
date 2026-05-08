import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const GuestRoute = ({ children }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return <div style={{ display: 'none' }}></div>;

    if (isAuthenticated && user) {
        const adminRoles = ['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter'];
        if (adminRoles.includes(user.role)) return <Navigate to="/" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};
export default GuestRoute;
