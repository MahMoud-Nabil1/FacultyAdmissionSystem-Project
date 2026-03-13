import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost, apiDelete } from '../../../services/api';

interface Announcement { _id: string; title: string; content: string; createdAt: string; }

const EMPTY = { title: '', content: '' };

export default function AnnouncementsScreen() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const { res, data } = await apiGet('/announcements');
            if (res.ok) setAnnouncements((data as any) ?? []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        setError('');
        if (!form.title.trim() || !form.content.trim()) { setError('يرجى ملء العنوان والمحتوى'); return; }
        setSaving(true);
        try {
            const { res, data } = await apiPost('/announcements', form);
            if (!res.ok) throw new Error((data as any).error || 'فشل النشر');
            setForm(EMPTY); setShowForm(false); await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = (a: Announcement) => {
        Alert.alert('حذف إعلان', `هل تريد حذف "${a.title}"؟`, [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'حذف', style: 'destructive', onPress: async () => {
                    try { await apiDelete(`/announcements/${a._id}`); await load(); }
                    catch (e: any) { Alert.alert('خطأ', e.message); }
                }
            },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>📣 الإعلانات</Text>

            <TouchableOpacity style={[styles.btn, showForm && styles.btnOutline]} onPress={() => { setShowForm(p => !p); setError(''); }}>
                <Ionicons name={showForm ? 'close' : 'megaphone-outline'} size={18} color={showForm ? '#ef4444' : '#fff'} />
                <Text style={[styles.btnText, showForm && styles.btnTextOutline]}>{showForm ? 'إلغاء' : 'إضافة إعلان جديد'}</Text>
            </TouchableOpacity>

            {showForm && (
                <View style={styles.form}>
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    <TextInput style={styles.input} placeholder="العنوان" placeholderTextColor="#9ca3af" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} textAlign="right" />
                    <TextInput style={[styles.input, styles.textarea]} placeholder="المحتوى" placeholderTextColor="#9ca3af" value={form.content} onChangeText={v => setForm(p => ({ ...p, content: v }))} multiline numberOfLines={4} textAlign="right" textAlignVertical="top" />
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>نشر الإعلان</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator color="#ef4444" style={{ marginTop: 32 }} />
            ) : announcements.length === 0 ? (
                <Text style={styles.empty}>لا توجد إعلانات حتى الآن</Text>
            ) : (
                announcements.map(a => (
                    <View key={a._id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{a.title}</Text>
                            <TouchableOpacity onPress={() => handleDelete(a)}>
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.cardContent}>{a.content}</Text>
                        <Text style={styles.cardDate}>{new Date(a.createdAt).toLocaleDateString('ar-EG')}</Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fef2f2' },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '800', color: '#ef4444', marginBottom: 16, textAlign: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef4444', borderRadius: 10, padding: 13, justifyContent: 'center', marginBottom: 16 },
    btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ef4444' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnTextOutline: { color: '#ef4444' },
    form: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111', backgroundColor: '#fafafa' },
    textarea: { minHeight: 100 },
    submitBtn: { backgroundColor: '#ef4444', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error: { color: '#ef4444', textAlign: 'center', marginBottom: 8 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#111', flex: 1, marginRight: 8, textAlign: 'right' },
    cardContent: { fontSize: 13, color: '#374151', lineHeight: 20, textAlign: 'right' },
    cardDate: { fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'right' },
});
