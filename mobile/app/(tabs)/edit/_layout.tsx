import { Stack } from 'expo-router';

export default function EditLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="students" />
            <Stack.Screen name="staff" />
            <Stack.Screen name="subjects" />
            <Stack.Screen name="groups" />
            <Stack.Screen name="places" />
            <Stack.Screen name="announcements" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="registration" />
        </Stack>
    );
}

