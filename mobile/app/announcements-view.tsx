import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllAnnouncements } from '../src/services/api';
import { useLanguage } from '../src/context/LanguageContext';
import CustomHeader from '../src/components/common/CustomHeader';
import ScreenContainer from '../src/components/common/ScreenContainer';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    createdAt: string;
}

export default function AnnouncementsView() {
    const { t } = useLanguage();
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await getAllAnnouncements();
            setItems((data as any) ?? []);
        } catch { /* silently ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <ScreenContainer>
            <CustomHeader title={t('announcements.title')} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} tintColor="#1a73e8" />}
            >
            {loading ? (
                <ActivityIndicator color="#1a73e8" style={{ marginTop: 40 }} />
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>{t('announcements.empty')}</Text>
                </View>
            ) : (
                items.map((a) => (
                    <View key={a._id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconDot}>
                                <Ionicons name="megaphone-outline" size={18} color="#1a73e8" />
                            </View>
                            <Text style={styles.cardTitle}>{a.title}</Text>
                        </View>
                        <Text style={styles.cardBody}>{a.content}</Text>
                        <Text style={styles.cardDate}>{fmt(a.createdAt)}</Text>
                    </View>
                ))
            )}
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    empty: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText: { fontSize: 15, color: '#9ca3af' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#1a73e8',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    iconDot: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: '#eff6ff',
        alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', flex: 1 },
    cardBody: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
    cardDate: { fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'right' },
});
