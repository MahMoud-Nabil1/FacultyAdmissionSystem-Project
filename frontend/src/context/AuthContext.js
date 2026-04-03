import React, { createContext, useContext, useEffect, useState } from 'react';
import {jwtDecode} from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        try {
            const payload = jwtDecode(savedToken);
            setUser(payload);
        } catch {
            sessionStorage.removeItem('token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

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
        sessionStorage.removeItem('token');
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