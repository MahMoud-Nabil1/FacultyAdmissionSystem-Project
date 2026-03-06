import { useEffect, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { apiGet, apiPost } from '../../services/api';

type Status = 'loading' | 'invalid' | 'valid' | 'success';

export default function ResetPassword() {
    // Token comes from the deep-link URL: faculty-admission://reset-password?token=xxx
    const { token } = useLocalSearchParams<{ token: string }>();

    const [status, setStatus] = useState<Status>('loading');
    const [verifyError, setVerifyError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── Verify the reset token on mount ──────────────────────────────────────
    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setVerifyError('رابط إعادة التعيين غير صالح. لم يتم العثور على الرمز.');
            return;
        }

        let cancelled = false;
        const verify = async () => {
            try {
                const { res, data } = await apiGet(
                    `/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
                    false
                );
                if (cancelled) return;
                if (res.ok && (data as { valid?: boolean }).valid) {
                    setStatus('valid');
                } else {
                    setStatus('invalid');
                    setVerifyError(
                        (data as { error?: string }).error || 'الرابط منتهي الصلاحية أو غير صالح.'
                    );
                }
            } catch {
                if (cancelled) return;
                setStatus('invalid');
                setVerifyError('تعذر التحقق من الرابط. حاول مرة أخرى.');
            }
        };
        verify();
        return () => { cancelled = true; };
    }, [token]);

    // ── Submit new password ───────────────────────────────────────────────────
    const handleSubmit = async () => {
        setError('');
        if (newPassword.length < 6) {
            setError('كلمة السر يجب أن تكون على الأقل 6 أحرف.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('كلمتا السر غير متطابقتين.');
            return;
        }
        setLoading(true);
        try {
            const { res, data } = await apiPost(
                '/auth/reset-password',
                { token: token as string, newPassword },
                false
            );
            if (!res.ok) {
                setError(
                    (data as { error?: string }).error || 'فشلت عملية إعادة تعيين كلمة السر.'
                );
                return;
            }
            setStatus('success');
            setTimeout(() => router.replace('/(auth)/login'), 2000);
        } catch {
            setError('تعذر التواصل مع السيرفر.');
        } finally {
            setLoading(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.statusMessage}>جار التحقق من الرابط...</Text>
            </View>
        );
    }

    // ── Invalid ───────────────────────────────────────────────────────────────
    if (status === 'invalid') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.icon}>❌</Text>
                <Text style={styles.statusTitle}>رابط غير صالح</Text>
                <Text style={styles.statusMessage}>{verifyError}</Text>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => router.replace('/(auth)/forgot-password')}
                >
                    <Text style={styles.btnText}>طلب رابط إعادة تعيين جديد</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Success ───────────────────────────────────────────────────────────────
    if (status === 'success') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.icon}>✅</Text>
                <Text style={styles.statusTitle}>تم التحديث!</Text>
                <Text style={styles.statusMessage}>
                    تم تحديث كلمة السر بنجاح! يتم التحويل إلى صفحة تسجيل الدخول...
                </Text>
            </View>
        );
    }

    // ── Valid — show form ─────────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.icon}>🔒</Text>
                    <Text style={styles.title}>إعادة تعيين كلمة السر</Text>
                    <Text style={styles.subtitle}>اكتب كلمة السر الجديدة الخاصة بك</Text>
                </View>

                {!!error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>كلمة السر الجديدة</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ادخل كلمة السر الجديدة"
                        placeholderTextColor="#9ca3af"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        textAlign="right"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>اعد كتابة كلمة السر</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="اعد كتابة كلمة السر الجديدة"
                        placeholderTextColor="#9ca3af"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        textAlign="right"
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
                        <Text style={styles.btnText}>تحديث كلمة السر</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.backLink}>← ارجع إلى تسجيل الدخول</Text>
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
    subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
    statusTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
    statusMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
        marginTop: 12,
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
    fieldGroup: { marginBottom: 16 },
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
