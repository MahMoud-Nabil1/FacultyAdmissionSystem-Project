import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Modal, Pressable,
    KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../common/CustomHeader';
import ScreenContainer from '../../common/ScreenContainer';
import { apiGet, apiPost, apiDelete } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';

interface Announcement { _id: string; title: string; content: string; createdAt: string; }

const EMPTY = { title: '', content: '' };

export default function AnnouncementsScreen() {
    const { t, locale } = useLanguage();
    const align = locale === 'ar' ? 'right' : 'left';

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const { res, data } = await apiGet('/announcements');
            if (res.ok) setAnnouncements((data as any) ?? []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const handleSubmit = async () => {
        setError('');
        if (!form.title.trim() || !form.content.trim()) { setError(t('announcements.fillAll')); return; }
        setSaving(true);
        try {
            const { res, data } = await apiPost('/announcements', form);
            if (!res.ok) throw new Error((data as any).error || t('announcements.publishFailed'));
            setForm(EMPTY); setShowForm(false); await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = (a: Announcement) => {
        Alert.alert(
            t('announcements.deleteTitle'),
            t('announcements.deleteMessage', { title: a.title }),
            [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await apiDelete(`/announcements/${a._id}`);
                        await load();
                    } catch (e: any) {
                        Alert.alert(t('common.error'), e.message);
                    }
                },
            },
            ]
        );
    };

    const closeModal = () => {
        setShowForm(false);
        setError('');
        setForm(EMPTY);
    };

    return (
        <ScreenContainer>
            <CustomHeader title={t('announcements.title')} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} tintColor="#1a73e8" />
                }
            >
                <TouchableOpacity
                    style={[styles.btn, showForm && styles.btnOutline]}
                    onPress={() => {
                        if (showForm) return closeModal();
                        setForm(EMPTY);
                        setError('');
                        setShowForm(true);
                    }}
                >
                    <Ionicons name={showForm ? 'close' : 'megaphone-outline'} size={18} color={showForm ? '#ef4444' : '#fff'} />
                    <Text style={[styles.btnText, showForm && styles.btnTextOutline]}>
                        {showForm ? t('common.cancel') : t('announcements.addNew')}
                    </Text>
                </TouchableOpacity>

                <Modal
                visible={showForm}
                animationType="fade"
                transparent
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={closeModal}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.close')}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                        style={styles.modalKeyboard}
                    >
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('announcements.modalTitle')}</Text>
                                <TouchableOpacity
                                    onPress={closeModal}
                                    style={styles.modalClose}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <Ionicons name="close" size={26} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalFormBody}>
                                {!!error && <Text style={styles.error}>{error}</Text>}
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('announcements.placeholders.title')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.title}
                                    onChangeText={v => setForm(p => ({ ...p, title: v }))}
                                    textAlign={align}
                                />
                                <TextInput
                                    style={[styles.input, styles.textarea]}
                                    placeholder={t('announcements.placeholders.content')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.content}
                                    onChangeText={v => setForm(p => ({ ...p, content: v }))}
                                    multiline
                                    numberOfLines={4}
                                    textAlign={align}
                                    textAlignVertical="top"
                                />
                                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                                    {saving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitText}>{t('announcements.submitBtn')}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {loading ? (
                <ActivityIndicator color="#1a73e8" style={{ marginTop: 32 }} />
            ) : announcements.length === 0 ? (
                <Text style={styles.empty}>{t('announcements.empty')}</Text>
            ) : (
                announcements.map(a => (
                    <View key={a._id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { textAlign: align }]}>{a.title}</Text>
                            <TouchableOpacity onPress={() => handleDelete(a)}>
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.cardContent, { textAlign: align }]}>{a.content}</Text>
                        <Text style={[styles.cardDate, { textAlign: align }]}>
                            {new Date(a.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                        </Text>
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
    title: { fontSize: 22, fontWeight: '800', color: '#1a73e8', marginBottom: 16, textAlign: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a73e8', borderRadius: 10, padding: 13, justifyContent: 'center', marginBottom: 16 },
    btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1a73e8' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnTextOutline: { color: '#1a73e8' },
    form: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111', backgroundColor: '#fafafa' },
    textarea: { minHeight: 100 },
    submitBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error: { color: '#ef4444', textAlign: 'center', marginBottom: 8 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
    },
    modalKeyboard: { width: '100%', maxWidth: 420, alignSelf: 'center', flexShrink: 1 },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#1a73e8',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a73e8' },
    modalClose: { padding: 4 },
    modalFormBody: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 22,
        gap: 9,
    },
    row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    badge: { backgroundColor: '#00A2E8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 14, fontWeight: '700', color: '#111' },
    rowSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    actionBtn: { padding: 6 },
    deleteBtn: { padding: 6 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#111', flex: 1, marginRight: 8, textAlign: 'right' },
    cardContent: { fontSize: 13, color: '#374151', lineHeight: 20, textAlign: 'right' },
    cardDate: { fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'right' },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 4,
    },
});