import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { jwtDecode } from 'jwt-decode';

export interface AuthUser {
    id: string;
    role: string;
    name?: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = (): AuthContextValue => useContext(AuthContext);

const setStorageItemAsync = async (key: string, value: string) => {
    if (Platform.OS === 'web') {
        try { return localStorage.setItem(key, value); } catch (e) { console.error('Local storage is unavailable:', e); }
    } else {
        await SecureStore.setItemAsync(key, value);
    }
};

const getStorageItemAsync = async (key: string) => {
    if (Platform.OS === 'web') {
        try { return localStorage.getItem(key); } catch (e) { console.error('Local storage is unavailable:', e); return null; }
    } else {
        return await SecureStore.getItemAsync(key);
    }
};

const deleteStorageItemAsync = async (key: string) => {
    if (Platform.OS === 'web') {
        try { return localStorage.removeItem(key); } catch (e) { console.error('Local storage is unavailable:', e); }
    } else {
        await SecureStore.deleteItemAsync(key);
    }
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const savedToken = await getStorageItemAsync('token');
                if (!savedToken) return;
                setToken(savedToken);
                const payload = jwtDecode(savedToken) as AuthUser;
                setUser(payload);
            } catch {
                await deleteStorageItemAsync('token');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (tokenValue: string): Promise<void> => {
        await setStorageItemAsync('token', tokenValue);
        setToken(tokenValue);
        try {
            const payload = jwtDecode(tokenValue) as AuthUser;
            setUser(payload);
        } catch {
            setUser(null);
        }
    };

    const logout = async (): Promise<void> => {
        await deleteStorageItemAsync('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
