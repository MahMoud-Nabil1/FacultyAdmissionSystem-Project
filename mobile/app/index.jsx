import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';


export default function Index() {
    const { isAuthenticated, user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            router.replace('/(auth)/login');
        } else if (user?.role) {
            router.replace('/(tabs)/home');
        }
    }, [loading, isAuthenticated, user]);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
