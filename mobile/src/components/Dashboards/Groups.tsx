import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { getAllGroups } from '../../services/api';

type GroupType = 'lecture' | 'lab' | 'tutorial' | 'seminar';
type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface IGroup {
    _id: string;
    number: number;
    subject: string;
    type: GroupType;
    from: number;
    to: number;
    day: WeekDay;
    place?: string;
    capacity: number;
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

export default function Groups() {
    const { token } = useAuth();
    const [groups, setGroups] = useState<IGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:5000/api';

    useEffect(() => {
        const fetchGroups = async () => {
            try {

                const data = await getAllGroups();
                setGroups(data);
            } catch (err: any) {

                Alert.alert('خطأ', err.message || 'تعذّر تحميل المجموعات');
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-forward" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>المجموعات</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="albums-outline" size={72} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>لا توجد مجموعات</Text>
                        <Text style={styles.emptySubtitle}>لم يتم تسجيلك في أي مجموعة بعد.</Text>
                    </View>
                ) : (
                    groups.map((group) => {
                        const badge = TYPE_STYLE[group.type] || TYPE_STYLE.lecture;
                        return (
                            <View key={group._id} style={styles.card}>
                                <View style={styles.topRow}>
                                    <Text style={styles.groupName}>مجموعة {group.number}</Text>
                                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                        <Ionicons name={badge.icon} size={13} color={badge.color} style={{ marginLeft: 4 }} />
                                        <Text style={[styles.badgeText, { color: badge.color }]}>
                                            {TYPE_LABEL[group.type]}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.subject}>{group.subject}</Text>
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
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9ff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#1a73e8',
        paddingTop: 50,
        paddingBottom: 18,
        paddingHorizontal: 20,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    scroll: { padding: 20, paddingBottom: 40 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#1a73e8',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    groupName: { fontSize: 16, fontWeight: '700', color: '#1f2937', textAlign: 'right' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    subject: { fontSize: 13, color: '#1a73e8', fontWeight: '600', textAlign: 'right', marginBottom: 12 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 12 },
    metaRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
    metaText: { fontSize: 12, color: '#6b7280', textAlign: 'right', marginRight: 6 },
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#4b5563', marginTop: 10 },
    emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 5 },
});