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
import { useLanguage } from '../../context/LanguageContext';
import { apiPost } from '../../services/api';

type Status = null | 'sent' | 'not_found';

export default function ForgotPassword() {
    const { t, locale } = useLanguage();
    const align = locale === 'ar' ? 'right' : 'left';
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    const handleSubmit = async () => {
        setError('');
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError(t('forgotPassword.emailRequired'));
            return;
        }
        setLoading(true);
        try {
            const { res, data } = await apiPost('/auth/forgot-password', { email: trimmed }, false);
            if (!res.ok) {
                setError((data as { error?: string }).error || t('forgotPassword.genericError'));
                return;
            }
            setStatus(
                (data as { message?: string }).message === 'message sent to the email'
                    ? 'sent'
                    : 'not_found'
            );
        } catch {
            setError(t('forgotPassword.serverUnreachable'));
        } finally {
            setLoading(false);
        }
    };

    // ── Success state ─────────────────────────────────────────────────────────
    if (status === 'sent') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.icon}>✅</Text>
                <Text style={[styles.statusTitle, { textAlign: align }]}>{t('forgotPassword.sentTitle')}</Text>
                <Text style={[styles.statusMessage, { textAlign: align }]}>
                    {t('forgotPassword.sentMessage')}
                </Text>
                <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.btnText}>{t('forgotPassword.backToLogin')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Not found state ───────────────────────────────────────────────────────
    if (status === 'not_found') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.icon}>❌</Text>
                <Text style={[styles.statusTitle, { textAlign: align }]}>{t('forgotPassword.notFoundTitle')}</Text>
                <Text style={[styles.statusMessage, { textAlign: align }]}>
                    {t('forgotPassword.notFoundMessage')}
                </Text>
                <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.btnText}>{t('forgotPassword.backToLogin')}</Text>
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
                    <Text style={[styles.title, { textAlign: align }]}>{t('forgotPassword.title')}</Text>
                    <Text style={[styles.subtitle, { textAlign: align }]}>{t('forgotPassword.subtitle')}</Text>
                </View>

                {!!error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.fieldGroup}>
                    <Text style={[styles.label, { textAlign: align }]}>{t('forgotPassword.emailLabel')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('forgotPassword.emailPlaceholder')}
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlign={align}
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
                        <Text style={styles.btnText}>{t('forgotPassword.submitBtn')}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={[styles.backLink, { textAlign: align }]}>{t('forgotPassword.backToLogin')}</Text>
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
    subtitle: { fontSize: 14, color: '#6b7280', lineHeight: 22, width: '100%' },
    statusTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8, width: '100%' },
    statusMessage: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 28,
        lineHeight: 22,
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
    fieldGroup: { marginBottom: 20 },
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
});
