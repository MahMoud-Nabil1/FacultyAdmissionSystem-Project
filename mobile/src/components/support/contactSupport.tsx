import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface FormData {
    studentCode: string;
    subjectName: string;
    message: string;
    replyEmail: string;
}

export default function SupportContact() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState<'it' | 'admin'>('it');
    const [formData, setFormData] = useState<FormData>({
        studentCode: user?.id || '',
        subjectName: '',
        message: '',
        replyEmail: '',
    });

    const isIT = selectedTarget === 'it';
    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:5000/api';

    const handleSubmit = async () => {
        if (!formData.studentCode || !formData.message) return Alert.alert('خطأ', 'يرجى ملء البيانات الأساسية');

        setLoading(true);
        try {
            const endpoint = `${API_BASE}/students/${isIT ? 'contact-it' : 'contact-admin'}`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                Alert.alert('تم الإرسال', 'سيتواصل معك القسم المختص قريباً');
                setFormData({ ...formData, subjectName: '', message: '' });
            } else {
                Alert.alert('خطأ', 'حدثت مشكلة أثناء الإرسال');
            }
        } catch {
            Alert.alert('خطأ', 'تعذر الاتصال بالسيرفر');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.headerIcon}>{isIT ? '👨‍💻' : '🏛️'}</Text>
                    <Text style={styles.title}>{isIT ? 'الدعم الفني' : 'شؤون الطلاب'}</Text>

                    <View style={styles.toggleRow}>
                        <TouchableOpacity style={[styles.toggleBtn, isIT && styles.activeIt]} onPress={() => setSelectedTarget('it')}>
                            <Text style={[styles.toggleText, isIT && styles.whiteText]}>IT Support</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.toggleBtn, !isIT && styles.activeAdmin]} onPress={() => setSelectedTarget('admin')}>
                            <Text style={[styles.toggleText, !isIT && styles.whiteText]}>إدارة الكلية</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>الكود الشخصي</Text>
                        <TextInput style={styles.input} value={formData.studentCode} onChangeText={t => setFormData({...formData, studentCode: t})} textAlign="right" keyboardType="numeric" />

                        <Text style={styles.label}>{isIT ? 'الموضوع' : 'كود المقرر (إن وجد)'}</Text>
                        <TextInput style={styles.input} value={formData.subjectName} onChangeText={t => setFormData({...formData, subjectName: t})} textAlign="right" />

                        <Text style={styles.label}>نص الرسالة</Text>
                        <TextInput style={[styles.input, styles.textArea]} value={formData.message} onChangeText={t => setFormData({...formData, message: t})} multiline numberOfLines={4} textAlign="right" />

                        <TouchableOpacity style={[styles.submitBtn, isIT ? styles.itBtn : styles.adminBtn]} onPress={handleSubmit} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>إرسال الآن</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    scroll: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 4 },
    headerIcon: { fontSize: 50, marginBottom: 10 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1a73e8', marginBottom: 20 },
    toggleRow: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 5, marginBottom: 25 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeIt: { backgroundColor: '#1a73e8' },
    activeAdmin: { backgroundColor: '#4b5563' },
    toggleText: { fontWeight: 'bold', color: '#666' },
    whiteText: { color: '#fff' },
    form: { width: '100%' },
    label: { textAlign: 'right', marginBottom: 8, fontSize: 14, color: '#374151', fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, marginBottom: 15, backgroundColor: '#fff' },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitBtn: { padding: 16, borderRadius: 10, alignItems: 'center' },
    itBtn: { backgroundColor: '#1a73e8' },
    adminBtn: { backgroundColor: '#4b5563' },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});