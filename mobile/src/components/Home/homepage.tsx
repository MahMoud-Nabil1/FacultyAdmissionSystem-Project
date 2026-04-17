import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Homepage = () => {
    const { token, logout, user } = useAuth();
    const { t } = useLanguage();
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
                if (res.ok) setFullData(data);
                else handleLogout();
            } catch (err) {
                Alert.alert(t('common.error'), t('home.serverError'));
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchProfile();
    }, [token, t]);


    const handleLogout = async () => {
        Alert.alert(
            t('home.logoutTitle'),
            t('home.logoutMessage'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('home.logoutConfirm'),
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1a73e8" /></View>;

    const role = user?.role || 'student';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>


            <View style={styles.headerCard}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.userName}>{fullData?.name || user?.name}</Text>

                {role === 'student' && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{fullData?.gpa || '0.0'}</Text>
                            <Text style={styles.statLabel}>{t('home.gpa')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{fullData?.completedHours || '0'}</Text>
                            <Text style={styles.statLabel}>{t('home.hours')}</Text>
                        </View>
                    </View>
                )}
            </View>

            <Text style={styles.sectionTitle}>{t('home.servicesTitle')}</Text>

            <View style={styles.menuGrid}>

                {role === 'student' && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#1a73e8' }]}
                        onPress={() => router.push('/(tabs)/register')}
                    >
                        <Ionicons name="book" size={32} color="#1a73e8" />
                        <Text style={styles.menuLabel}>{t('home.registerSubjects')}</Text>
                    </TouchableOpacity>
                )}

                {role === 'student' && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#1a73e8' }]}
                        onPress={() => router.push('/academic-history')}
                    >
                        <Ionicons name="school-outline" size={32} color="#1a73e8" />
                        <Text style={styles.menuLabel}>{t('home.academicHistory')}</Text>
                    </TouchableOpacity>
                )}

                {(role === 'academic_guide' || role === 'academic_guide_coordinator') && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#1a73e8' }]}
                        onPress={() => router.push('/students-list')}
                    >
                        <Ionicons name="people" size={32} color="#1a73e8" />
                        <Text style={styles.menuLabel}>{t('home.studentsList')}</Text>
                    </TouchableOpacity>
                )}

                {(role === 'reporter' || role === 'admin') && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#1a73e8' }]}
                        onPress={() => router.push('/reports')}
                    >
                        <Ionicons name="stats-chart" size={32} color="#1a73e8" />
                        <Text style={styles.menuLabel}>{t('home.statistics')}</Text>
                    </TouchableOpacity>
                )}

                {(role === 'reporter' || role === 'admin') && (
                    <TouchableOpacity
                        style={[styles.menuCard, { borderBottomColor: '#1a73e8' }]}
                        onPress={() => router.push('/admin-complaints')}
                    >
                        <Ionicons name="mail-unread" size={32} color="#1a73e8" />
                        <Text style={styles.menuLabel}>{t('home.complaints')}</Text>
                    </TouchableOpacity>
                )}
            </View>


            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#ef4444" style={{marginLeft: 8}} />
                <Text style={styles.logoutButtonText}>{t('home.logout')}</Text>
            </TouchableOpacity>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    scroll: { padding: 20, paddingTop: 90 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerCard: { backgroundColor: '#fff', borderRadius: 25, padding: 25, alignItems: 'center', elevation: 4 },
    avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    statsContainer: { flexDirection: 'row-reverse', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', width: '100%' },
    statBox: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1a73e8' },
    statLabel: { fontSize: 11, color: '#9ca3af' },
    statDivider: { width: 1, backgroundColor: '#f0f0f0' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 20, textAlign: 'right' },
    menuGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
    menuCard: { backgroundColor: '#fff', width: (width - 55) / 2, padding: 20, borderRadius: 18, alignItems: 'center', marginBottom: 15, borderBottomWidth: 4, elevation: 2 },
    menuLabel: { fontSize: 14, fontWeight: 'bold', color: '#4b5563', marginTop: 10 },
    logoutButton: { marginTop: 20, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', padding: 15 },
    logoutButtonText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});

export default Homepage;