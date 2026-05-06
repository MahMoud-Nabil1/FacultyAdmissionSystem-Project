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

// Extended AuthUser interface with all student properties
export interface AuthUser {
    id: string;
    _id?: string;
    role: string;
    name?: string;
    avatar?: string | null;
    email?: string | null;
    studentId?: number | string;
    gpa?: number;
    department?: string;
    level?: string;
    registeredHours?: number;
    completedHours?: number;
    completedSubjects?: string[];
    registeredSubjects?: string[];
    currentSessionId?: string | null;
}

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (userData: AuthUser) => void;
    fetchFullUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
    login: async () => { },
    logout: async () => { },
    updateUser: () => { },
    fetchFullUserData: async () => { },
});

export const useAuth = (): AuthContextValue => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch full user data from backend
    const fetchFullUserData = async () => {
        if (!token) return;

        try {
            const API_BASE = 'http://localhost:5000/api'; // Adjust to your API URL
            const response = await fetch(${API_BASE}/auth/me, {
                headers: {
                    'Authorization': Bearer ${token},
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const fullUserData = await response.json();
                setUser(prev => ({
                    ...prev,
                    ...fullUserData,
                    id: fullUserData.id || fullUserData._id || prev?.id,
                    role: fullUserData.role || prev?.role || 'student',
                }));
            }
        } catch (error) {
            console.error('Error fetching full user data:', error);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const savedToken = await getStorageItemAsync('token');
                if (!savedToken) {
                    setLoading(false);
                    return;
                }

                const payload = jwtDecode<{ exp: number } & AuthUser>(savedToken);

                // Check if token is expired
                if (payload.exp && payload.exp < Date.now() / 1000) {
                    await deleteStorageItemAsync('token');
                    setLoading(false);
                    return;
                }

                setToken(savedToken);
                setUser({
                    id: payload.id || payload._id,
                    _id: payload._id,
                    role: payload.role || 'student',
                    name: payload.name,
                    email: payload.email,
                    studentId: payload.studentId,
                    gpa: payload.gpa,
                    department: payload.department,
                    level: payload.level,
                    registeredHours: payload.registeredHours,
                    completedHours: payload.completedHours,
                    avatar: payload.avatar,
                });

                // Fetch full user data from backend
                await fetchFullUserData();
            } catch (error) {
                console.error('Auth error:', error);
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
            setUser({
                id: payload.id || payload._id,
                _id: payload._id,
                role: payload.role || 'student',
                name: payload.name,
                email: payload.email,
                studentId: payload.studentId,
                gpa: payload.gpa,
                department: payload.department,
                level: payload.level,
                registeredHours: payload.registeredHours,
                completedHours: payload.completedHours,
                avatar: payload.avatar,
            });

            // Fetch full user data after login
            setTimeout(() => fetchFullUserData(), 100);
        } catch (error) {
            console.error('Login decode error:', error);
            setUser(null);
        }
    };

    const logout = async (): Promise<void> => {
        // Clear chat history for the current user
        const userId = user?.id || user?._id || user?.studentId;
        if (userId) {
            try {
                await AsyncStorage.removeItem(aiChatMessages_${userId});
            } catch (error) {
                console.error('Error clearing chat history:', error);
            }
        }
        await deleteStorageItemAsync('token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData: AuthUser) => {
        setUser(prev => {
            if (prev && userData && !userData.avatar && prev.avatar) {
                return { ...userData, avatar: prev.avatar };
            }
            return userData;
        });
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            loading,
            login,
            logout,
            updateUser,
            fetchFullUserData
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;





