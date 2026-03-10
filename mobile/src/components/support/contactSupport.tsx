import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';


interface FormData {
    studentCode: string;
    subjectName: string;
    message: string;
    replyEmail: string;
}

interface Status {
    type: 'success' | 'error' | '';
    text: string;
}

interface Props {
    target?: 'it' | 'admin';
}


const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const Support: React.FC<Props> = ({ target = 'it' }) => {
    const [formData, setFormData] = useState<FormData>({
        studentCode: '',
        subjectName: '',
        message: '',
        replyEmail: '',
    });

    const [status, setStatus] = useState<Status>({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState<'it' | 'admin'>(target);

    const isIT = selectedTarget === 'it';

    const handleChange = (name: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (status.text) setStatus({ type: '', text: '' });
    };

    const validate = () => {
        const { studentCode, subjectName, message, replyEmail } = formData;

        if (!/^\d{7}$/.test(studentCode.trim()))
            return 'يجب أن يتكون كود الطالب من 7 أرقام.';

        if (!subjectName.trim()) {
            return isIT ? 'يرجى إدخال موضوع المشكلة.' : 'الرجاء إدخال كود المقرر الدراسي.';
        }

        if (!message.trim()) return 'يرجى وصف مشكلتك بالتفصيل.';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(replyEmail)) return 'يرجى إدخال بريد إلكتروني صحيح للرد.';

        return null;
    };

    const handleSubmit = async () => {
        const error = validate();
        if (error) {
            setStatus({ type: 'error', text: error });
            Alert.alert('تنبيه', error);
            return;
        }

        setLoading(true);
        setStatus({ type: '', text: '' });

        const endpoint = isIT
            ? `${BASE_URL}/api/students/contact-it`
            : `${BASE_URL}/api/students/contact-admin`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                const successMsg = isIT ? 'تم إرسال طلب الدعم الفني بنجاح.' : 'تم إرسال طلبك للإدارة بنجاح.';
                setStatus({ type: 'success', text: successMsg });
                Alert.alert('تم بنجاح', successMsg);
                setFormData({ studentCode: '', subjectName: '', message: '', replyEmail: '' });
            } else {
                setStatus({ type: 'error', text: data.error || 'حدث خطأ ما.' });
                Alert.alert('خطأ', data.error || 'حدث خطأ ما.');
            }
        } catch (error) {
            setStatus({ type: 'error', text: 'فشل الاتصال بالسيرفر.' });
            Alert.alert('خطأ', 'فشل الاتصال بالسيرفر. تأكد من تشغيل الـ Backend وعنوان الـ IP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>

                    <View style={styles.header}>
                        <Text style={styles.icon}>{isIT ? '💻' : '🛡️'}</Text>
                        <Text style={styles.title}>{isIT ? 'الدعم الفني' : 'شؤون الطلاب والادارة'}</Text>
                    </View>


                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, isIT && styles.activeIT]}
                            onPress={() => setSelectedTarget('it')}
                        >
                            <Text style={[styles.toggleText, isIT && styles.activeText]}>💻 IT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, !isIT && styles.activeAdmin]}
                            onPress={() => setSelectedTarget('admin')}
                        >
                            <Text style={[styles.toggleText, !isIT && styles.activeText]}>🛡️ الإدارة</Text>
                        </TouchableOpacity>
                    </View>


                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>كود الطالب <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                value={formData.studentCode}
                                onChangeText={(val) => handleChange('studentCode', val)}
                                placeholder="7 أرقام"
                                keyboardType="numeric"
                                maxLength={7}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                {isIT ? 'موضوع المشكلة' : 'كود المقرر الدراسي'} <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={formData.subjectName}
                                onChangeText={(val) => handleChange('subjectName', val)}
                                placeholder={isIT ? "الموضوع" : "مثال: CS306"}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>تفاصيل الرسالة <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.message}
                                onChangeText={(val) => handleChange('message', val)}
                                placeholder="اشرح لنا المشكلة..."
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>بريد الرد <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                value={formData.replyEmail}
                                onChangeText={(val) => handleChange('replyEmail', val)}
                                placeholder="email@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {status.text ? (
                            <Text style={[styles.statusMsg, status.type === 'error' ? styles.errorText : styles.successText]}>
                                {status.text}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.submitBtn, isIT ? styles.itBtn : styles.adminBtn, loading && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>إرسال الطلب</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContent: { padding: 20, alignItems: 'center' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: { alignItems: 'center', marginBottom: 20 },
    icon: { fontSize: 40, marginBottom: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    toggleContainer: { flexDirection: 'row', marginBottom: 25, borderRadius: 10, backgroundColor: '#eee', padding: 4 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeIT: { backgroundColor: '#007bff' },
    activeAdmin: { backgroundColor: '#6c757d' },
    toggleText: { color: '#666', fontWeight: '600' },
    activeText: { color: '#fff' },
    form: { width: '100%' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#444', marginBottom: 5, textAlign: 'right' },
    required: { color: 'red' },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        textAlign: 'right',
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    statusMsg: { textAlign: 'center', marginVertical: 10, padding: 10, borderRadius: 5 },
    errorText: { backgroundColor: '#ffebee', color: '#c62828' },
    successText: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
    submitBtn: { padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    itBtn: { backgroundColor: '#007bff' },
    adminBtn: { backgroundColor: '#6c757d' },
    disabledBtn: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default Support;