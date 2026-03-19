import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Modal, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllGroups, createGroup, deleteGroup } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

interface Group { _id: string; subject: string; number: number; place: string; day: string; from: number; to: number; capacity: number; }

const EMPTY = { number: '', subject: '', place: '', day: '', from: '', to: '', capacity: '' };

const FIELD_KEYS = ['number', 'subject', 'place', 'day', 'from', 'to', 'capacity'] as const;

export default function GroupsScreen() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin';
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllGroups();
            setGroups((data as any) ?? []);
        } catch (e: any) { Alert.alert(t('common.error'), e.message); }
        finally { setLoading(false); }
    }, [t]);

    useEffect(() => { load(); }, [load]);

    const closeModal = () => {
        setShowForm(false);
        setError('');
        setForm(EMPTY);
    };

    const handleSubmit = async () => {
        setError('');
        if (!form.number || !form.subject || !form.place || !form.day || !form.from || !form.to || !form.capacity) {
            setError(t('groups.fillAll')); return;
        }
        setSaving(true);
        try {
            await createGroup({
                number: Number(form.number),
                subject: form.subject.trim(),
                type: 'lecture',
                place: form.place,
                day: form.day,
                from: Number(form.from),
                to: Number(form.to),
                capacity: Number(form.capacity),
            });
            setForm(EMPTY);
            setShowForm(false);
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = (g: Group) => {
        Alert.alert(t('groups.deleteTitle'), t('groups.deleteMessage', { number: g.number }), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: async () => { try { await deleteGroup(g._id); await load(); } catch (e: any) { Alert.alert(t('common.error'), e.message); } } },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>🗂️ {t('groups.title')}</Text>

            {isAdmin && (
                <TouchableOpacity style={styles.btn} onPress={() => { setShowForm(true); setError(''); }}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>{t('groups.addGroup')}</Text>
                </TouchableOpacity>
            )}

            <Modal
                visible={isAdmin && showForm}
                animationType="fade"
                transparent
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} accessibilityRole="button" accessibilityLabel={t('common.close')} />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                        style={styles.modalKeyboard}
                    >
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('groups.modalTitle')}</Text>
                                <TouchableOpacity onPress={closeModal} style={styles.modalClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                    <Ionicons name="close" size={26} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalFormBody}>
                                {!!error && <Text style={styles.error}>{error}</Text>}
                                {FIELD_KEYS.map((key) => {
                                    const kb = (key === 'number' || key === 'from' || key === 'to' || key === 'capacity') ? 'number-pad' as const : undefined;
                                    return (
                                        <TextInput
                                            key={key}
                                            style={styles.input}
                                            placeholder={t(`groups.placeholders.${key}`)}
                                            placeholderTextColor="#9ca3af"
                                            value={(form as any)[key]}
                                            onChangeText={v => setForm(p => ({ ...p, [key]: v }))}
                                            keyboardType={kb}
                                            textAlign="right"
                                        />
                                    );
                                })}
                                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('groups.saveGroup')}</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {loading ? (
                <ActivityIndicator color="#f59e0b" style={{ marginTop: 32 }} />
            ) : groups.length === 0 ? (
                <Text style={styles.empty}>لا توجد مجموعات حتى الآن</Text>
            ) : (
                groups.map(group => (
                    <View key={group._id} style={styles.row}>
                        <View style={styles.badge}><Text style={styles.badgeText}>#{group.number}</Text></View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{group.subject} </Text>
                            <Text style={styles.rowSub}>{group.from}:00 – {group.to}:00 • {group.day} • {group.capacity} {t('groups.seat')}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(group)} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fffbeb' },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '800', color: '#f59e0b', marginBottom: 16, textAlign: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f59e0b', borderRadius: 10, padding: 13, justifyContent: 'center', marginBottom: 16 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
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
        borderColor: '#f59e0b',
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
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#f59e0b' },
    modalClose: { padding: 4 },
    modalFormBody: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 22,
        gap: 9,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#111',
        backgroundColor: '#fafafa',
    },
    submitBtn: {
        backgroundColor: '#f59e0b',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 6,
    },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error: { color: '#ef4444', textAlign: 'center', marginBottom: 8 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
    row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    badge: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: '#92400e', fontWeight: '700', fontSize: 12 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '700', color: '#111' },
    rowSub: { fontSize: 15, color: '#6b7280', marginTop: 2 },
    deleteBtn: { padding: 6 },
});
