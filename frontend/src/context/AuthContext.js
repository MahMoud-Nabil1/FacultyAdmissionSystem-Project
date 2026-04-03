import React, { createContext, useContext, useEffect, useState } from 'react';
import {jwtDecode} from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const savedToken = localStorage.getItem('token');

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
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                } else {
                    setToken(savedToken);
                    setUser(payload);
                }
            } catch {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Check for token removal in other tabs or through API calls
        const handleStorageChange = (e) => {
            if (e.key === 'token' && !e.newValue) {
                setToken(null);
                setUser(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Polling as a fallback for the same tab token removal if not using an event emitter
        const interval = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            if (!currentToken && token) {
                setToken(null);
                setUser(null);
            }
        }, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [token]);

    const login = (tokenValue) => {
        localStorage.setItem('token', tokenValue);
        setToken(tokenValue);

        try {
            const payload = jwtDecode(tokenValue);
            setUser(payload);
        } catch {
            setUser(null);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;