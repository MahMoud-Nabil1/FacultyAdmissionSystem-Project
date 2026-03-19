import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllStudents, createStudent, deleteStudent } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

interface Student {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    gpa: number;
}

const EMPTY = { studentId: '', name: '', email: '', password: '', gpa: '' };

export default function StudentsScreen() {
    const { t } = useLanguage();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllStudents();
            setStudents((data as any) ?? []);
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        setError('');
        if (!form.studentId || !form.name || !form.email || !form.password) {
            setError('يرجى ملء جميع الحقول');
            return;
        }
        setSaving(true);
        try {
            await createStudent({ ...form, gpa: Number(form.gpa) || 0 });
            setForm(EMPTY);
            setShowForm(false);
            await load();
        } catch (e: any) {
            setError(e.status === 409 ? t('students.duplicateCode') : e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (s: Student) => {
        Alert.alert('حذف طالب', `هل تريد حذف ${s.name}؟`, [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'حذف', style: 'destructive',
                onPress: async () => {
                    try { await deleteStudent(s._id); await load(); }
                    catch (e: any) { Alert.alert('خطأ', e.message); }
                },
            },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>👨‍🎓 {t('students.title')}</Text>

            <TouchableOpacity
                style={[styles.btn, showForm && styles.btnOutline]}
                onPress={() => { setShowForm(p => !p); setError(''); }}
            >
                <Ionicons name={showForm ? 'close' : 'person-add-outline'} size={18} color={showForm ? '#1a73e8' : '#fff'} />
                <Text style={[styles.btnText, showForm && styles.btnTextOutline]}>
                    {showForm ? t('students.cancel') : t('students.addStudent')}
                </Text>
            </TouchableOpacity>

            {showForm && (
                <View style={styles.form}>
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    {[
                        { key: 'studentId', ph: t('students.placeholders.studentId') },
                        { key: 'name', ph: t('students.placeholders.name') },
                        { key: 'email', ph: t('students.placeholders.email'), kb: 'email-address' as const },
                        { key: 'gpa', ph: t('students.placeholders.gpa'), kb: 'decimal-pad' as const },
                        { key: 'password', ph: t('students.placeholders.password'), secure: true },
                    ].map(f => (
                        <TextInput
                            key={f.key}
                            style={styles.input}
                            placeholder={f.ph}
                            placeholderTextColor="#9ca3af"
                            value={(form as any)[f.key]}
                            onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                            keyboardType={f.kb}
                            secureTextEntry={f.secure}
                            textAlign="right"
                        />
                    ))}
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('students.saveStudent')}</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator color="#1a73e8" style={{ marginTop: 32 }} />
            ) : students.length === 0 ? (
                <Text style={styles.empty}>{t('students.empty')}</Text>
            ) : (
                students.map(s => (
                    <View key={s._id} style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{s.name}</Text>
                            <Text style={styles.rowSub}>{s.studentId} • {t('students.rowGpa', { gpa: s.gpa })}</Text>
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
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    content: { padding: 20, paddingBottom: 40 },
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
    row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 15, fontWeight: '700', color: '#111' },
    rowSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    deleteBtn: { padding: 6 },
});
