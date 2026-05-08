import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import LanguageSwitcher from '../src/components/LanguageSwitcher';
import AiChatBox from '../src/components/common/AiChatBox';

export default function RootLayout() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="index" />
                </Stack>
                {/* Floating AI chat button — visible on all authenticated screens */}
                <AiChatBox />
            </AuthProvider>
        </LanguageProvider>
    );
}
