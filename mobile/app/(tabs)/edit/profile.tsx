import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { getAllGroups } from '../../../src/services/api';

const { width } = Dimensions.get('window');

type GroupType = 'lecture' | 'lab' | 'tutorial' | 'seminar';
type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface IGroup {
    _id: string;
    number: number;
    subject: string;
    type: GroupType;
    from: number;
    to: number;
    day: WeekDay;
    place?: string;
    capacity: number;
    students?: any[];
}

const TYPE_LABEL: Record<GroupType, string> = {
    lecture: 'محاضرة',
    lab: 'معمل',
    tutorial: 'تمرين',
    seminar: 'سيمينار',
};

const TYPE_STYLE: Record<GroupType, { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    lecture: { bg: '#dbeafe', color: '#1e40af', icon: 'easel-outline' },
    lab: { bg: '#d1fae5', color: '#065f46', icon: 'flask-outline' },
    tutorial: { bg: '#fef3c7', color: '#92400e', icon: 'pencil-outline' },
    seminar: { bg: '#ede9fe', color: '#5b21b6', icon: 'mic-outline' },
};

const DAY_AR: Record<WeekDay, string> = {
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    sunday: 'الأحد',
};

function formatTime(h: number): string {
    return `${String(h).padStart(2, '0')}:00`;
}

export default function Profile() {
    const { token, logout, user } = useAuth();
    const { t } = useLanguage();
    const [profileData, setProfileData] = useState<any>(null);
    const [enrolledGroups, setEnrolledGroups] = useState<IGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:5000/api';

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fetch profile
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const pData = await res.json();

                if (!res.ok) {
                    await handleLogout();
                    return;
                }
                setProfileData(pData);

                // Fetch groups and filter by studentg
                const groups = await getAllGroups();
                const myGroups = groups.filter((g: IGroup) => {
                    if (!g.students) return false;
                    return g.students.some((s: any) =>
                        s === pData._id || (s && s._id === pData._id)
                    );
                });

                // Sort by day and time
                const dayOrder: Record<WeekDay, number> = {
                    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7
                };
                myGroups.sort((a, b) => {
                    if (dayOrder[a.day] !== dayOrder[b.day]) {
                        return dayOrder[a.day] - dayOrder[b.day];
                    }
                    return a.from - b.from;
                });

                setEnrolledGroups(myGroups);
            } catch (err) {
                Alert.alert(t('common.error'), t('home.serverError'));
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchAll();
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

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    // Get unique subjects
    const enrolledSubjects = Array.from(new Set(enrolledGroups.map(g => g.subject)));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('tabs.profile')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Basic Info Card ── */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{profileData?.name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.userName}>{profileData?.name}</Text>
                    <Text style={styles.userInfo}>{profileData?.id} • {profileData?.department || 'General'}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{profileData?.gpa || '0.0'}</Text>
                            <Text style={styles.statLabel}>{t('home.gpa')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{profileData?.registeredHours || '0'}</Text>
                            <Text style={styles.statLabel}>ساعات مسجلة</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{profileData?.completedHours || '0'}</Text>
                            <Text style={styles.statLabel}>مكتملة</Text>
                        </View>
                    </View>
                </View>

                {/* ── Enrolled Subjects ── */}
                <Text style={styles.sectionTitle}>المواد المسجلة ({enrolledSubjects.length})</Text>
                {enrolledSubjects.length === 0 ? (
                    <Text style={styles.emptyText}>لا توجد مواد مسجلة.</Text>
                ) : (
                    <View style={styles.subjectsContainer}>
                        {enrolledSubjects.map((subj, index) => (
                            <View key={index} style={styles.subjectBadge}>
                                <Text style={styles.subjectBadgeText}>{subj}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Weekly Schedule ── */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>الجدول الأسبوعي</Text>
                {enrolledGroups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={50} color="#d1d5db" />
                        <Text style={styles.emptyText}>الجدول فارغ</Text>
                    </View>
                ) : (
                    enrolledGroups.map((group) => {
                        const badge = TYPE_STYLE[group.type] || TYPE_STYLE.lecture;
                        return (
                            <View key={group._id} style={styles.scheduleCard}>
                                <View style={styles.topRow}>
                                    <Text style={styles.groupName}>{group.subject}</Text>
                                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                        <Ionicons name={badge.icon} size={12} color={badge.color} style={{ marginLeft: 4 }} />
                                        <Text style={[styles.badgeText, { color: badge.color }]}>
                                            {TYPE_LABEL[group.type]} - {group.number}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.metaRow}>
                                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                                    <Text style={styles.metaText}>{DAY_AR[group.day]}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                                    <Text style={styles.metaText}>
                                        {formatTime(group.from)} – {formatTime(group.to)}
                                    </Text>
                                </View>
                                {group.place && (
                                    <View style={styles.metaRow}>
                                        <Ionicons name="location-outline" size={14} color="#9ca3af" />
                                        <Text style={styles.metaText}>{group.place}</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#ef4444" style={{ marginLeft: 8 }} />
                    <Text style={styles.logoutButtonText}>{t('home.logout')}</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#1a73e8',
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    scroll: { padding: 20 },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        elevation: 4,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatarContainer: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a73e8',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12
    },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    userInfo: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
    statsContainer: {
        flexDirection: 'row-reverse',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        width: '100%',
    },
    statBox: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: 'bold', color: '#1a73e8' },
    statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
    statDivider: { width: 1, backgroundColor: '#e5e7eb' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 15, textAlign: 'right' },
    subjectsContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
    subjectBadge: {
        backgroundColor: '#1a73e8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
    },
    subjectBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    emptyState: { alignItems: 'center', paddingVertical: 30 },
    emptyText: { fontSize: 15, color: '#9ca3af', textAlign: 'center', marginTop: 10 },

    scheduleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderRightWidth: 4,
        borderRightColor: '#1a73e8',
        elevation: 2,
    },
    topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    groupName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', textAlign: 'right' },
    badge: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 10 },
    metaRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
    metaText: { fontSize: 13, color: '#4b5563', textAlign: 'right', marginRight: 8 },

    logoutButton: {
        marginTop: 30,
        backgroundColor: '#fee2e2',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
    },
    logoutButtonText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});
