import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedRole = localStorage.getItem('role');
        const savedId = localStorage.getItem('userId');

        if (savedToken && savedRole) {
            setToken(savedToken);
            setUser({ id: savedId, role: savedRole });
        }
        setLoading(false);
    }, []);

    const login = (tokenValue, role, userId) => {
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('role', role);
        localStorage.setItem('userId', userId);
        setToken(tokenValue);
        setUser({ id: userId, role });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
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
