import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = (): AuthContextValue => useContext(AuthContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load persisted token on app start (replaces localStorage)
    useEffect(() => {
        (async () => {
            try {
                const savedToken = await SecureStore.getItemAsync('token');
                if (!savedToken) return;
                setToken(savedToken);
                const payload = jwtDecode(savedToken) as AuthUser;
                setUser(payload);
            } catch {
                await SecureStore.deleteItemAsync('token');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (tokenValue: string): Promise<void> => {
        await SecureStore.setItemAsync('token', tokenValue);
        setToken(tokenValue);
        try {
            const payload = jwtDecode(tokenValue) as AuthUser;
            setUser(payload);
        } catch {
            setUser(null);
        }
    };

    const logout = async (): Promise<void> => {
        await SecureStore.deleteItemAsync('token');
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
