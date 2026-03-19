import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { getAllStaff, createStaff, deleteStaff } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

const STAFF_ROLE_KEYS = ['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter'] as const;

const EMPTY = { name: '', email: '', password: '', role: 'admin' };

interface Staff { _id: string; name: string; email: string; role: string; }

export default function StaffScreen() {
    const { t } = useLanguage();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllStaff();
            setStaff((data as any) ?? []);
        } catch (e: any) { Alert.alert(t('common.error'), e.message); }
        finally { setLoading(false); }
    }, [t]);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        setError('');
        if (!form.name || !form.email || !form.password) { setError(t('staff.fillAll')); return; }
        setSaving(true);
        try {
            await createStaff(form);
            setForm(EMPTY); setShowForm(false); await load();
        } catch (e: any) {
            setError(e.status === 409 ? t('staff.duplicateEmail') : e.message);
        } finally { setSaving(false); }
    };

    const handleDelete = (s: Staff) => {
        Alert.alert(t('staff.deleteTitle'), t('staff.deleteMessage', { name: s.name }), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: async () => { try { await deleteStaff(s._id); await load(); } catch (e: any) { Alert.alert(t('common.error'), e.message); } } },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>👨‍💼 {t('staff.title')}</Text>

            <TouchableOpacity style={[styles.btn, showForm && styles.btnOutline]} onPress={() => { setShowForm(p => !p); setError(''); }}>
                <Ionicons name={showForm ? 'close' : 'person-add-outline'} size={18} color={showForm ? '#8b5cf6' : '#fff'} />
                <Text style={[styles.btnText, showForm && styles.btnTextOutline]}>{showForm ? t('staff.cancel') : t('staff.addStaff')}</Text>
            </TouchableOpacity>

            {showForm && (
                <View style={styles.form}>
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    <TextInput style={styles.input} placeholder={t('staff.placeholders.name')} placeholderTextColor="#9ca3af" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} textAlign="right" />
                    <TextInput style={styles.input} placeholder={t('staff.placeholders.email')} placeholderTextColor="#9ca3af" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} keyboardType="email-address" textAlign="right" />
                    <TextInput style={styles.input} placeholder={t('staff.placeholders.password')} placeholderTextColor="#9ca3af" value={form.password} onChangeText={v => setForm(p => ({ ...p, password: v }))} secureTextEntry textAlign="right" />
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                            {STAFF_ROLE_KEYS.map(roleKey => (
                                <Picker.Item key={roleKey} label={t(`staff.roles.${roleKey}`)} value={roleKey} />
                            ))}
                        </Picker>
                    </View>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('staff.saveStaff')}</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator color="#8b5cf6" style={{ marginTop: 32 }} />
            ) : staff.length === 0 ? (
                <Text style={styles.empty}>{t('staff.empty')}</Text>
            ) : (
                staff.map(s => (
                    <View key={s._id} style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{s.name}</Text>
                            <Text style={styles.rowSub}>
                                {(STAFF_ROLE_KEYS as readonly string[]).includes(s.role)
                                    ? t(`staff.roles.${s.role}`)
                                    : s.role}
                            </Text>
                            <Text style={styles.rowSub}>{s.email}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(s)} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f3ff' },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '800', color: '#8b5cf6', marginBottom: 16, textAlign: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#8b5cf6', borderRadius: 10, padding: 13, justifyContent: 'center', marginBottom: 16 },
    btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#8b5cf6' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnTextOutline: { color: '#8b5cf6' },
    form: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111', backgroundColor: '#fafafa' },
    pickerWrap: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fafafa' },
    submitBtn: { backgroundColor: '#8b5cf6', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error: { color: '#ef4444', textAlign: 'center', marginBottom: 8 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
    row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 15, fontWeight: '700', color: '#111' },
    rowSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    deleteBtn: { padding: 6 },
});
