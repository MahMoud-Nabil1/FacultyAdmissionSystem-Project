import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const setStorageItemAsync = async (key: string, value: string) => {
    if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
};

const getStorageItemAsync = async (key: string) => {
    if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
    } else {
        return await SecureStore.getItemAsync(key);
    }
};

const deleteStorageItemAsync = async (key: string) => {
    if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
    } else {
        await SecureStore.deleteItemAsync(key);
    }
};
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const savedToken = await getStorageItemAsync('token');
                if (!savedToken) return;
                
                const payload = jwtDecode<{ exp: number } & AuthUser>(savedToken);
                
                // Check if token is expired
                if (payload.exp && payload.exp < Date.now() / 1000) {
                    await deleteStorageItemAsync('token');
                    return;
                }
                
                setToken(savedToken);
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
