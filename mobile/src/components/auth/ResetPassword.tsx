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
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { apiGet, apiPost } from '../../services/api';

type Status = 'loading' | 'invalid' | 'valid' | 'success';
type VerifyIssue = 'missing_token' | 'api' | 'network' | null;

export default function ResetPassword() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const { t, locale } = useLanguage();
    const align = locale === 'ar' ? 'right' : 'left';

    const [status, setStatus] = useState<Status>('loading');
    const [verifyIssue, setVerifyIssue] = useState<VerifyIssue>(null);
    const [verifyDetail, setVerifyDetail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const verifyMessage =
        verifyIssue === 'missing_token'
            ? t('resetPassword.noToken')
            : verifyIssue === 'network'
              ? t('resetPassword.verifyNetwork')
              : verifyDetail || t('resetPassword.expiredOrInvalid');

    // ── Verify the reset token on mount ──────────────────────────────────────
    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setVerifyIssue('missing_token');
            setVerifyDetail('');
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
                    setVerifyIssue(null);
                    setVerifyDetail('');
                } else {
                    setStatus('invalid');
                    setVerifyIssue('api');
                    setVerifyDetail((data as { error?: string }).error || '');
                }
            } catch {
                if (cancelled) return;
                setStatus('invalid');
                setVerifyIssue('network');
                setVerifyDetail('');
            }
        };
        verify();
        return () => {
            cancelled = true;
        };
    }, [token]);

    // ── Submit new password ───────────────────────────────────────────────────
    const handleSubmit = async () => {
        setError('');
        if (newPassword.length < 6) {
            setError(t('resetPassword.passwordMin'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('resetPassword.passwordMismatch'));
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
                setError((data as { error?: string }).error || t('resetPassword.resetFailed'));
                return;
            }
            setStatus('success');
            setTimeout(() => router.replace('/(auth)/login'), 2000);
        } catch {
            setError(t('resetPassword.serverUnreachable'));
        } finally {
            setLoading(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={[styles.statusMessage, { textAlign: align }]}>{t('resetPassword.verifying')}</Text>
            </View>
        );
    }

    // ── Invalid ───────────────────────────────────────────────────────────────
    if (status === 'invalid') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.icon}>❌</Text>
                <Text style={[styles.statusTitle, { textAlign: align }]}>{t('resetPassword.invalidTitle')}</Text>
                <Text style={[styles.statusMessage, { textAlign: align }]}>{verifyMessage}</Text>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => router.replace('/(auth)/forgot-password')}
                >
                    <Text style={styles.btnText}>{t('resetPassword.requestNewLink')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Success ───────────────────────────────────────────────────────────────
    if (status === 'success') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.icon}>✅</Text>
                <Text style={[styles.statusTitle, { textAlign: align }]}>{t('resetPassword.successTitle')}</Text>
                <Text style={[styles.statusMessage, { textAlign: align }]}>
                    {t('resetPassword.successMessage')}
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
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#1a73e8" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.icon}>🔒</Text>
                    <Text style={[styles.title, { textAlign: align }]}>{t('resetPassword.title')}</Text>
                    <Text style={[styles.subtitle, { textAlign: align }]}>{t('resetPassword.subtitle')}</Text>
                </View>

                {!!error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { textAlign: align }]}>{t('resetPassword.newPasswordLabel')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('resetPassword.newPasswordPlaceholder')}
                        placeholderTextColor="#9ca3af"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        textAlign={align}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { textAlign: align }]}>{t('resetPassword.confirmLabel')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('resetPassword.confirmPlaceholder')}
                        placeholderTextColor="#9ca3af"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        textAlign={align}
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
                        <Text style={styles.btnText}>{t('resetPassword.submitBtn')}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                    <Text style={[styles.backLink, { textAlign: align }]}>{t('resetPassword.backToLogin')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    scroll: { flexGrow: 1, padding: 24, paddingBottom: 80, justifyContent: 'center' },
    centerContainer: {
        flex: 1,
        backgroundColor: '#f0f4ff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    header: { alignItems: 'center', marginBottom: 28 },
    icon: { fontSize: 52, marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '700', color: '#1a73e8', marginBottom: 8, width: '100%' },
    subtitle: { fontSize: 14, color: '#6b7280', width: '100%' },
    statusTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8, width: '100%' },
    statusMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 28,
        lineHeight: 22,
        marginTop: 12,
        width: '100%',
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
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, width: '100%' },
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
        width: '100%',
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { color: '#1a73e8', fontSize: 14, width: '100%' },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 24,
        zIndex: 10,
        padding: 4,
    },
});
