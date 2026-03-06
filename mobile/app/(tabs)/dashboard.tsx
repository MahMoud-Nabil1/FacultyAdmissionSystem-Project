import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function Dashboard() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.welcome}>مرحباً، {user?.name ?? user?.role ?? 'مستخدم'} 👋</Text>
            <Text style={styles.role}>الدور: {user?.role}</Text>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4ff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    welcome: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a73e8',
        marginBottom: 8,
        textAlign: 'center',
    },
    role: {
        fontSize: 15,
        color: '#6b7280',
        marginBottom: 40,
    },
    logoutBtn: {
        backgroundColor: '#ef4444',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
