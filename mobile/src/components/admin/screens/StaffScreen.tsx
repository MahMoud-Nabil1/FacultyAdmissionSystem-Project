import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { getAllStaff, createStaff, deleteStaff } from '../../../services/api';

const ROLES: Record<string, string> = {
    admin: 'ادمن',
    academic_guide: 'مرشد أكاديمى',
    academic_guide_coordinator: 'منسق الإرشاد الأكاديمى',
    reporter: 'مُراجع بيانات',
};

const EMPTY = { name: '', email: '', password: '', role: 'admin' };

interface Staff { _id: string; name: string; email: string; role: string; }

export default function StaffScreen() {
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
        } catch (e: any) { Alert.alert('خطأ', e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        setError('');
        if (!form.name || !form.email || !form.password) { setError('يرجى ملء جميع الحقول'); return; }
        setSaving(true);
        try {
            await createStaff(form);
            setForm(EMPTY); setShowForm(false); await load();
        } catch (e: any) {
            setError(e.status === 409 ? 'يوجد موظف بنفس الإيميل' : e.message);
        } finally { setSaving(false); }
    };

    const handleDelete = (s: Staff) => {
        Alert.alert('حذف موظف', `هل تريد حذف ${s.name}؟`, [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'حذف', style: 'destructive', onPress: async () => { try { await deleteStaff(s._id); await load(); } catch (e: any) { Alert.alert('خطأ', e.message); } } },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>👨‍💼 الموظفين</Text>

            <TouchableOpacity style={[styles.btn, showForm && styles.btnOutline]} onPress={() => { setShowForm(p => !p); setError(''); }}>
                <Ionicons name={showForm ? 'close' : 'person-add-outline'} size={18} color={showForm ? '#8b5cf6' : '#fff'} />
                <Text style={[styles.btnText, showForm && styles.btnTextOutline]}>{showForm ? 'إلغاء' : 'إضافة موظف جديد'}</Text>
            </TouchableOpacity>

            {showForm && (
                <View style={styles.form}>
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    <TextInput style={styles.input} placeholder="الاسم" placeholderTextColor="#9ca3af" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} textAlign="right" />
                    <TextInput style={styles.input} placeholder="الإيميل" placeholderTextColor="#9ca3af" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} keyboardType="email-address" textAlign="right" />
                    <TextInput style={styles.input} placeholder="كلمة السر" placeholderTextColor="#9ca3af" value={form.password} onChangeText={v => setForm(p => ({ ...p, password: v }))} secureTextEntry textAlign="right" />
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                            {Object.entries(ROLES).map(([v, l]) => <Picker.Item key={v} label={l} value={v} />)}
                        </Picker>
                    </View>
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>حفظ الموظف</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator color="#8b5cf6" style={{ marginTop: 32 }} />
            ) : staff.length === 0 ? (
                <Text style={styles.empty}>لا يوجد موظفين حتى الآن</Text>
            ) : (
                staff.map(s => (
                    <View key={s._id} style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{s.name}</Text>
                            <Text style={styles.rowSub}>{ROLES[s.role] ?? s.role}</Text>
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
