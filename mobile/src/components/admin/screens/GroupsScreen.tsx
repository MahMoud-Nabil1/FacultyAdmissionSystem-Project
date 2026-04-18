import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Modal, Pressable, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../common/CustomHeader';
import ScreenContainer from '../../common/ScreenContainer';
import { getAllGroups, createGroup, deleteGroup, getAllSubjects } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

interface Group { _id: string; subject: string; number: number; place: string; day: string; from: number; to: number; capacity: number; }
interface Subject { _id: string; code: string; name: string; }

const EMPTY = { number: '', subject: '', place: '', day: '', from: '', to: '', capacity: '' };

const FIELD_KEYS = ['number', 'place', 'day', 'from', 'to', 'capacity'] as const;

export default function GroupsScreen() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin';
    const isCoordinator = user?.role === 'academic_guide_coordinator';
    const isAdvisor = user?.role === 'academic_guide';
    const canAdd = isAdmin || isCoordinator;
    const readOnly = isAdvisor;
    const [groups, setGroups] = useState<Group[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllGroups();
            setGroups((data as any) ?? []);
        } catch (e: any) { Alert.alert(t('common.error'), e.message); }
        finally { setLoading(false); }
    }, [t]);

    const loadSubjects = useCallback(async () => {
        try {
            const data = await getAllSubjects();
            setSubjects((data as any) ?? []);
        } catch (e: any) { console.error('Failed to load subjects:', e); }
    }, []);

    useEffect(() => { load(); loadSubjects(); }, [load, loadSubjects]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

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
        <ScreenContainer>
            <CustomHeader title={t('groups.title')} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} tintColor="#1a73e8" />
                }
            >

            {canAdd && !readOnly && (
                <TouchableOpacity style={styles.btn} onPress={() => { setShowForm(true); setError(''); }}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={styles.btnText}>{t('groups.addGroup')}</Text>
                </TouchableOpacity>
            )}

            <Modal
                visible={canAdd && !readOnly && showForm}
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

                                {/* Subject Picker */}
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={form.subject}
                                        onValueChange={(v) => setForm(p => ({ ...p, subject: v }))}
                                        style={styles.picker}
                                        mode="dropdown"
                                    >
                                        <Picker.Item label={t('groups.placeholders.subject')} value="" enabled={false} />
                                        {subjects.map(s => (
                                            <Picker.Item key={s._id} label={`${s.code.toUpperCase()} - ${s.name}`} value={s.code.toLowerCase()} />
                                        ))}
                                    </Picker>
                                </View>

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
                <Text style={styles.empty}>{t('groups.empty')}</Text>
            ) : (
                groups.map(group => (
                    <View key={group._id} style={styles.row}>
                        <View style={styles.badge}><Text style={styles.badgeText}>#{group.number}</Text></View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{group.subject} </Text>
                            <Text style={styles.rowSub}>{group.from}:00 – {group.to}:00 • {group.day} • {group.capacity} {t('groups.seat')}</Text>
                        </View>
                        {canAdd && !readOnly && (
                            <TouchableOpacity onPress={() => handleDelete(group)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}
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
    pickerWrapper: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#fafafa', overflow: 'hidden' },
    picker: { height: 50, width: '100%' },
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
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 4,
    },
});
