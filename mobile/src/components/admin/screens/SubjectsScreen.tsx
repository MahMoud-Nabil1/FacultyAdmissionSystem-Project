import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from '../../../services/api';

interface Subject { _id: string; code: string; name: string; creditHours: number; }

const EMPTY = { code: '', name: '', creditHours: '' };

export default function SubjectsScreen() {
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
        } catch (e: any) { Alert.alert('خطأ', e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openAdd = () => {
        setEditingId(null); setForm(EMPTY);
        setShowForm(p => !p); setError('');
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
        if (!code) { setError('رمز المقرر مطلوب'); return; }
        if (!name) { setError('اسم المقرر مطلوب'); return; }
        if (!Number.isInteger(credit) || credit < 0) { setError('عدد الساعات غير صحيح'); return; }
        setSaving(true);
        try {
            if (editingId) { await updateSubject(editingId, { code, name, creditHours: credit }); }
            else { await createSubject({ code, name, creditHours: credit }); }
            setForm(EMPTY); setShowForm(false); setEditingId(null); await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = (s: Subject) => {
        Alert.alert('حذف مقرر', `هل تريد حذف ${s.name}؟`, [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'حذف', style: 'destructive', onPress: async () => { try { await deleteSubject(s._id); await load(); } catch (e: any) { Alert.alert('خطأ', e.message); } } },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>📚 المقررات</Text>

            <TouchableOpacity style={[styles.btn, showForm && !editingId && styles.btnOutline]} onPress={openAdd}>
                <Ionicons name={showForm && !editingId ? 'close' : 'add-circle-outline'} size={18} color={showForm && !editingId ? '#10b981' : '#fff'} />
                <Text style={[styles.btnText, showForm && !editingId && styles.btnTextOutline]}>
                    {showForm && !editingId ? 'إلغاء' : 'إضافة مقرر جديد'}
                </Text>
            </TouchableOpacity>

            {showForm && (
                <View style={styles.form}>
                    <Text style={styles.formTitle}>{editingId ? 'تعديل مقرر' : 'مقرر جديد'}</Text>
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    <TextInput style={styles.input} placeholder="رمز المقرر (مثال: CS201)" placeholderTextColor="#9ca3af" value={form.code} onChangeText={v => setForm(p => ({ ...p, code: v }))} autoCapitalize="characters" />
                    <TextInput style={styles.input} placeholder="اسم المقرر" placeholderTextColor="#9ca3af" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} textAlign="right" />
                    <TextInput style={styles.input} placeholder="عدد الساعات المعتمدة" placeholderTextColor="#9ca3af" value={form.creditHours} onChangeText={v => setForm(p => ({ ...p, creditHours: v }))} keyboardType="number-pad" />
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>حفظ</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator color="#10b981" style={{ marginTop: 32 }} />
            ) : subjects.length === 0 ? (
                <Text style={styles.empty}>لا توجد مقررات حتى الآن</Text>
            ) : (
                subjects.map(s => (
                    <View key={s._id} style={styles.row}>
                        <View style={styles.badge}><Text style={styles.badgeText}>{s.code}</Text></View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{s.name}</Text>
                            <Text style={styles.rowSub}>{s.creditHours} ساعة معتمدة</Text>
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
    container: { flex: 1, backgroundColor: '#ecfdf5' },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '800', color: '#10b981', marginBottom: 16, textAlign: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#10b981', borderRadius: 10, padding: 13, justifyContent: 'center', marginBottom: 16 },
    btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#10b981' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnTextOutline: { color: '#10b981' },
    form: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    formTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111', backgroundColor: '#fafafa' },
    submitBtn: { backgroundColor: '#10b981', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error: { color: '#ef4444', textAlign: 'center', marginBottom: 8 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
    row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    badge: { backgroundColor: '#d1fae5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: '#065f46', fontWeight: '700', fontSize: 12 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 14, fontWeight: '700', color: '#111' },
    rowSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    actionBtn: { padding: 6 },
});
