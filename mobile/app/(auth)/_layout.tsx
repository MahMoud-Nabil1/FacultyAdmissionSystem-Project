import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#1a73e8' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerBackTitle: 'رجوع',
            }}
        >
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ title: 'نسيت كلمة السر' }} />
            <Stack.Screen name="reset-password" options={{ title: 'إعادة تعيين كلمة السر' }} />
        </Stack>
    );
}
