import React, { createContext, useContext, useEffect, useState } from 'react';
import {jwtDecode} from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper function to clear chat history for a user
    const clearChatHistory = (userId) => {
        if (userId) {
            localStorage.removeItem(`aiChatMessages_${userId}`);
        }
    };

    useEffect(() => {
        const checkAuth = () => {
            const savedToken = sessionStorage.getItem('token');

            if (!savedToken) {
                setToken(null);
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const payload = jwtDecode(savedToken);
                const now = Date.now() / 1000;
                if (payload.exp && payload.exp < now) {
                    sessionStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                } else {
                    setToken(savedToken);
                    setUser(payload);
                }
            } catch {
                sessionStorage.removeItem('token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        const interval = setInterval(() => {
            const currentToken = sessionStorage.getItem('token');
            if (!currentToken && token) {
                setToken(null);
                setUser(null);
            }
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, [token]);

    const login = (tokenValue) => {
        sessionStorage.setItem('token', tokenValue);
        setToken(tokenValue);

        try {
            const payload = jwtDecode(tokenValue);
            setUser(payload);
        } catch {
            setUser(null);
        }
    };

    const logout = () => {
        // Clear chat history for the current user before logging out
        const userId = user?.id || user?._id || user?.studentId;
        if (userId) {
            clearChatHistory(userId);
        }
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token;
    const updateUser = (userData) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;