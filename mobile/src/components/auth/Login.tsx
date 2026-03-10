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
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../services/api';

interface LoginPayload {
    id: string;
    role: string;
    name?: string;
}

export default function Login() {
    const { login } = useAuth();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async () => {
        setError('');
        if (!userId.trim() || !password) {
            setError('يرجى ملء جميع الحقول');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/auth/login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: userId.trim(), password }),
                }
            );
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'فشل تسجيل الدخول');
                return;
            }

            await login(data.token);

            const payload = jwtDecode(data.token) as LoginPayload;
            if (payload.role) {
                router.replace('/(tabs)/home');
            } else {
                router.replace('/');
            }
        } catch {
            setError('لم يمكن التواصل مع السيرفر');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🎓</Text>
                    <Text style={styles.university}>جامعة القاهرة - كلية العلوم</Text>
                    <Text style={styles.title}>تسجيل الدخول</Text>
                    <Text style={styles.subtitle}>يرجى إدخال بيانات الاعتماد الخاصة بك للوصول</Text>
                </View>

                {/* Error Banner */}
                {!!error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Identifier Field */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>كود الطالب أو الإيميل</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ادخل كود الطالب أو الإيميل"
                        placeholderTextColor="#9ca3af"
                        value={userId}
                        onChangeText={setUserId}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlign="right"
                    />
                </View>

                {/* Password Field */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>كلمة السر</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, styles.passwordInput]}
                            placeholder="ادخل كلمة السر"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            textAlign="right"
                        />
                        <TouchableOpacity
                            style={styles.eyeBtn}
                            onPress={() => setShowPassword((v: boolean) => !v)}
                        >
                            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                    <Text style={styles.link}>نسيت كلمة السر؟</Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>سجل الدخول</Text>
                    )}
                </TouchableOpacity>

                {/* Contact Support Button (pre-login, for guests / prospective students) */}
                <View style={styles.supportDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>أو</Text>
                    <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                    style={styles.supportBtn}
                    onPress={() => router.push('/(auth)/support')}
                >
                    <Text style={styles.supportBtnText}>🎧  تواصل مع الدعم</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 28 },
    logo: { fontSize: 52, marginBottom: 8 },
    university: { fontSize: 13, color: '#6b7280', marginBottom: 12, textAlign: 'center' },
    title: { fontSize: 26, fontWeight: '700', color: '#1a73e8', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
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
    passwordRow: { flexDirection: 'row', alignItems: 'center' },
    passwordInput: {
        flex: 1,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    eyeBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        borderRightWidth: 0,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    eyeText: { fontSize: 18 },
    link: { color: '#1a73e8', textAlign: 'right', marginBottom: 24, fontSize: 14 },
    btn: { backgroundColor: '#1a73e8', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    supportDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#d1d5db' },
    dividerText: { marginHorizontal: 12, color: '#9ca3af', fontSize: 13 },
    supportBtn: {
        borderWidth: 1.5,
        borderColor: '#1a73e8',
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: 'center',
        backgroundColor: '#eff6ff',
    },
    supportBtnText: { color: '#1a73e8', fontSize: 15, fontWeight: '700' },
});
