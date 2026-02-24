import React, { createContext, useContext, useState, useEffect } from 'react';

import {jwtDecode} from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');

        if (!savedToken) {
            setLoading(false);
            return;
        }

        setToken(savedToken);

        try {
            const payload = jwtDecode(savedToken);
            setUser(payload);
        } catch {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (tokenValue) => {
        localStorage.setItem('token', tokenValue);
        setToken(tokenValue);
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
