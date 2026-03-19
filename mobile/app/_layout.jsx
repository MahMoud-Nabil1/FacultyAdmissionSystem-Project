import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import LanguageSwitcher from '../src/components/LanguageSwitcher';

export default function RootLayout() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <StatusBar style="auto" />
                <LanguageSwitcher floating />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="index" />
                </Stack>
            </AuthProvider>
        </LanguageProvider>
    );
}
