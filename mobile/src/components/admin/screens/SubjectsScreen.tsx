import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Modal, Pressable,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

interface Subject { _id: string; code: string; name: string; creditHours: number; }

const EMPTY = { code: '', name: '', creditHours: '' };

export default function SubjectsScreen() {
    const { t } = useLanguage();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllSubjects();
            setSubjects((data as any) ?? []);
        } catch (e: any) { Alert.alert(t('common.error'), e.message); }
        finally { setLoading(false); }
    }, [t]);

    useEffect(() => { load(); }, [load]);

    const openAdd = () => {
        setEditingId(null); setForm(EMPTY);
        setShowForm(true);
        setError('');
    };

    const openEdit = (s: Subject) => {
        setEditingId(s._id);
        setForm({ code: s.code, name: s.name, creditHours: String(s.creditHours) });
        setShowForm(true); setError('');
    };

    const handleSubmit = async () => {
        setError('');
        const code = form.code.trim().toUpperCase();
        const name = form.name.trim();
        const credit = Number(form.creditHours);
        if (!code) { setError(t('subjects.codeRequired')); return; }
        if (!name) { setError(t('subjects.nameRequired')); return; }
        if (!Number.isInteger(credit) || credit < 0) { setError(t('subjects.invalidCredits')); return; }
        setSaving(true);
        try {
            if (editingId) { await updateSubject(editingId, { code, name, creditHours: credit }); }
            else { await createSubject({ code, name, creditHours: credit }); }
            setForm(EMPTY); setShowForm(false); setEditingId(null); await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = (s: Subject) => {
        Alert.alert(t('subjects.deleteTitle'), t('subjects.deleteMessage', { name: s.name }), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: async () => { try { await deleteSubject(s._id); await load(); } catch (e: any) { Alert.alert(t('common.error'), e.message); } } },
        ]);
    };

    const closeModal = () => {
        setShowForm(false);
        setError('');
        setEditingId(null);
        setForm(EMPTY);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>📚 {t('subjects.title')}</Text>

            <TouchableOpacity
                style={[styles.btn, showForm && !editingId && styles.btnOutline]}
                onPress={() => {
                    if (showForm) return closeModal();
                    return openAdd();
                }}
            >
                <Ionicons name={showForm && !editingId ? 'close' : 'add-circle-outline'} size={18} color={showForm && !editingId ? '#10b981' : '#fff'} />
                <Text style={[styles.btnText, showForm && !editingId && styles.btnTextOutline]}>
                    {showForm && !editingId ? t('subjects.cancel') : t('subjects.addSubject')}
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
                                <Text style={styles.modalTitle}>
                                    {editingId ? t('subjects.editSubject') : t('subjects.newSubject')}
                                </Text>
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
                                    placeholder={t('subjects.placeholders.code')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.code}
                                    onChangeText={v => setForm(p => ({ ...p, code: v }))}
                                    autoCapitalize="characters"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('subjects.placeholders.name')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.name}
                                    onChangeText={v => setForm(p => ({ ...p, name: v }))}
                                    textAlign="right"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('subjects.placeholders.creditHours')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.creditHours}
                                    onChangeText={v => setForm(p => ({ ...p, creditHours: v }))}
                                    keyboardType="number-pad"
                                />
                                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                                    {saving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitText}>{t('subjects.save')}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {loading ? (
                <ActivityIndicator color="#10b981" style={{ marginTop: 32 }} />
            ) : subjects.length === 0 ? (
                <Text style={styles.empty}>{t('subjects.empty')}</Text>
            ) : (
                subjects.map(s => (
                    <View key={s._id} style={styles.row}>
                        <View style={styles.badge}><Text style={styles.badgeText}>{s.code}</Text></View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{s.name}</Text>
                            <Text style={styles.rowSub}>{t('subjects.creditsShort', { hours: s.creditHours })}</Text>
                        </View>
                        <TouchableOpacity onPress={() => openEdit(s)} style={styles.actionBtn}>
                            <Ionicons name="create-outline" size={20} color="#10b981" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(s)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    content: { padding: 20, paddingTop: 90, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '800', color: '#1a73e8', marginBottom: 16, textAlign: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a73e8', borderRadius: 10, padding: 13, justifyContent: 'center', marginBottom: 16 },
    btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1a73e8' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnTextOutline: { color: '#1a73e8' },
    form: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111', backgroundColor: '#fafafa' },
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
});
