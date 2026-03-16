import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllGroups, createGroup, deleteGroup } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

interface Group { _id: string; number: number; place: string; day: string; from: number; to: number; capacity: number; }

const EMPTY = { number: '', place: '', day: '', from: '', to: '', capacity: '' };

export default function GroupsScreen() {
    const { user } = useAuth();
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
        } catch (e: any) { Alert.alert('خطأ', e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        setError('');
        if (!form.number || !form.place || !form.day || !form.from || !form.to || !form.capacity) {
            setError('يرجى ملء جميع الحقول'); return;
        }
        setSaving(true);
        try {
            await createGroup({ number: Number(form.number), place: form.place, day: form.day, from: Number(form.from), to: Number(form.to), capacity: Number(form.capacity) });
            setForm(EMPTY); setShowForm(false); await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = (g: Group) => {
        Alert.alert('حذف مجموعة', `حذف المجموعة رقم ${g.number}؟`, [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'حذف', style: 'destructive', onPress: async () => { try { await deleteGroup(g._id); await load(); } catch (e: any) { Alert.alert('خطأ', e.message); } } },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>🗂️ المجموعات</Text>

            {isAdmin && (
                <TouchableOpacity style={[styles.btn, showForm && styles.btnOutline]} onPress={() => { setShowForm(p => !p); setError(''); }}>
                    <Ionicons name={showForm ? 'close' : 'add-circle-outline'} size={18} color={showForm ? '#f59e0b' : '#fff'} />
                    <Text style={[styles.btnText, showForm && styles.btnTextOutline]}>{showForm ? 'إلغاء' : 'إضافة مجموعة'}</Text>
                </TouchableOpacity>
            )}

            {isAdmin && showForm && (
                <View style={styles.form}>
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    {[
                        { key: 'number', ph: 'رقم المجموعة', kb: 'number-pad' as const },
                        { key: 'place', ph: 'المكان' },
                        { key: 'day', ph: 'اليوم' },
                        { key: 'from', ph: 'من (ساعة)', kb: 'number-pad' as const },
                        { key: 'to', ph: 'إلى (ساعة)', kb: 'number-pad' as const },
                        { key: 'capacity', ph: 'السعة', kb: 'number-pad' as const },
                    ].map(f => (
                        <TextInput key={f.key} style={styles.input} placeholder={f.ph} placeholderTextColor="#9ca3af"
                            value={(form as any)[f.key]} onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                            keyboardType={f.kb} textAlign="right" />
                    ))}
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>حفظ المجموعة</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator color="#f59e0b" style={{ marginTop: 32 }} />
            ) : groups.length === 0 ? (
                <Text style={styles.empty}>لا توجد مجموعات حتى الآن</Text>
            ) : (
                groups.map(g => (
                    <View key={g._id} style={styles.row}>
                        <View style={styles.badge}><Text style={styles.badgeText}>#{g.number}</Text></View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{g.place} • {g.day}</Text>
                            <Text style={styles.rowSub}>{g.from}:00 – {g.to}:00 • {g.capacity} مقعد</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(g)} style={styles.deleteBtn}>
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
    btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f59e0b' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnTextOutline: { color: '#f59e0b' },
    form: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111', backgroundColor: '#fafafa' },
    submitBtn: { backgroundColor: '#f59e0b', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error: { color: '#ef4444', textAlign: 'center', marginBottom: 8 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
    row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    badge: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { color: '#92400e', fontWeight: '700', fontSize: 12 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 14, fontWeight: '700', color: '#111' },
    rowSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    deleteBtn: { padding: 6 },
});
