import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { apiPost } from '../../services/api';

type Status = null | 'sent' | 'not_found';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    const handleSubmit = async () => {
        setError('');
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError('البريد الإلكتروني مطلوب.');
            return;
        }
        setLoading(true);
        try {
            const { res, data } = await apiPost('/auth/forgot-password', { email: trimmed }, false);
            if (!res.ok) {
                setError((data as { error?: string }).error || 'حدث خطأ ما.');
                return;
            }
            setStatus(
                (data as { message?: string }).message === 'message sent to the email'
                    ? 'sent'
                    : 'not_found'
            );
        } catch {
            setError('تعذر التواصل مع السيرفر.');
        } finally {
            setLoading(false);
        }
    };

    // ── Success state ─────────────────────────────────────────────────────────
    if (status === 'sent') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.icon}>✅</Text>
                <Text style={styles.statusTitle}>تم الإرسال!</Text>
                <Text style={styles.statusMessage}>
                    تم إرسال رابط إعادة التعيين بنجاح إلى بريدك الإلكتروني.
                </Text>
                <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.btnText}>← العودة لتسجيل الدخول</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Not found state ───────────────────────────────────────────────────────
    if (status === 'not_found') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.icon}>❌</Text>
                <Text style={styles.statusTitle}>غير موجود</Text>
                <Text style={styles.statusMessage}>
                    لا يوجد حساب مرتبط بهذا البريد الإلكتروني.
                </Text>
                <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.btnText}>← العودة لتسجيل الدخول</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Form state ────────────────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.icon}>🔑</Text>
                    <Text style={styles.title}>نسيت كلمة المرور</Text>
                    <Text style={styles.subtitle}>
                        ادخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.
                    </Text>
                </View>

                {!!error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>البريد الإلكتروني</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="أدخل بريدك الإلكتروني"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlign="right"
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>إرسال رابط إعادة التعيين</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>← العودة لتسجيل الدخول</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    centerContainer: {
        flex: 1,
        backgroundColor: '#f0f4ff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    header: { alignItems: 'center', marginBottom: 28 },
    icon: { fontSize: 52, marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '700', color: '#1a73e8', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
    statusTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
    statusMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    errorBox: {
        backgroundColor: '#fee2e2',
        borderColor: '#f87171',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    errorText: { color: '#b91c1c', textAlign: 'center', fontSize: 14 },
    fieldGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, textAlign: 'right' },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
    },
    btn: {
        backgroundColor: '#1a73e8',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { color: '#1a73e8', textAlign: 'center', fontSize: 14 },
});
