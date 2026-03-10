import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const ROLES_LABELS: Record<string, string> = {
    student: "طالب",
    academic_guide: "مرشد أكاديمي",
    academic_guide_coordinator: "منسق الإرشاد",
    reporter: "منسق بيانات",
    admin: "مسؤول النظام"
};

const Homepage = () => {
    const { token, logout, user } = useAuth();
    const [fullData, setFullData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:5000/api';

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setFullData(data);
                } else {

                    logout();
                    router.replace('/(auth)/login');
                }
            } catch (err) {
                Alert.alert("خطأ في الاتصال", "تأكد من اتصالك بالإنترنت أو حالة السيرفر");
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchProfile();
    }, [token]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={{marginTop: 10, color: '#1a73e8'}}>جاري تحميل بياناتك...</Text>
            </View>
        );
    }

    const role = user?.role || 'student';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>


            <View style={styles.headerCard}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.welcomeText}>أهلاً بك،</Text>
                <Text style={styles.userName}>{fullData?.name || user?.name}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{ROLES_LABELS[role]}</Text>
                </View>


                {role === 'student' && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{fullData?.gpa || '0.0'}</Text>
                            <Text style={styles.statLabel}>المعدل التراكمي</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{fullData?.completedHours || '0'}</Text>
                            <Text style={styles.statLabel}>ساعة مكتملة</Text>
                        </View>
                    </View>
                )}
            </View>


            <Text style={styles.sectionTitle}>الخدمات المتاحة</Text>

            <View style={styles.menuGrid}>

                {role === 'student' && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#10b981' }]}
                        onPress={() => router.push('/register-subjects')}
                    >
                        <Text style={styles.menuIcon}>📖</Text>
                        <Text style={styles.menuLabel}>تسجيل المواد</Text>
                    </TouchableOpacity>
                )}


                {(role === 'academic_guide' || role === 'academic_guide_coordinator') && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#f59e0b' }]}
                        onPress={() => router.push('/students-list')}
                    >
                        <Text style={styles.menuIcon}>👨‍🎓</Text>
                        <Text style={styles.menuLabel}>قائمة طلابي</Text>
                    </TouchableOpacity>
                )}


                {role === 'admin' && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#ef4444' }]}
                        onPress={() => router.push('/admin/settings')}
                    >
                        <Text style={styles.menuIcon}>⚙️</Text>
                        <Text style={styles.menuLabel}>إدارة النظام</Text>
                    </TouchableOpacity>
                )}


                {(role === 'reporter' || role === 'admin') && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#6366f1' }]}
                        onPress={() => router.push('/reports')}
                    >
                        <Text style={styles.menuIcon}>📊</Text>
                        <Text style={styles.menuLabel}>الإحصائيات</Text>
                    </TouchableOpacity>
                )}


                <TouchableOpacity
                    style={[styles.menuCard, { borderBottomColor: '#1a73e8' }]}
                    onPress={() => router.push('/(auth)/support')}
                >
                    <Text style={styles.menuIcon}>🎧</Text>
                    <Text style={styles.menuLabel}>الدعم الفني</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuCard, { borderBottomColor: '#6b7280' }]}
                    onPress={() => router.push('/settings')}
                >
                    <Text style={styles.menuIcon}>🔒</Text>
                    <Text style={styles.menuLabel}>الحساب</Text>
                </TouchableOpacity>
            </View>


            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
            </TouchableOpacity>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f6ff' },
    scroll: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header Card
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        marginBottom: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#1a73e8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    welcomeText: { fontSize: 14, color: '#6b7280' },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 2 },
    badge: {
        backgroundColor: '#eef2ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 10,
    },
    badgeText: { color: '#1a73e8', fontSize: 12, fontWeight: 'bold' },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        marginTop: 25,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        width: '100%',
    },
    statBox: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1a73e8' },
    statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
    statDivider: { width: 1, height: '80%', backgroundColor: '#f3f4f6' },

    // Menu Grid
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 15, textAlign: 'right' },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    menuCard: {
        backgroundColor: '#fff',
        width: (width - 55) / 2, // حساب ديناميكي لعرض الكارت حسب الشاشة
        padding: 20,
        borderRadius: 18,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        borderBottomWidth: 4,
    },
    menuIcon: { fontSize: 30, marginBottom: 10 },
    menuLabel: { fontSize: 14, fontWeight: 'bold', color: '#4b5563' },

    // Logout
    logoutButton: {
        marginTop: 20,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    logoutButtonText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});

export default Homepage;