import { Stack } from 'expo-router';

export default function EditLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#1a73e8' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="students" options={{ title: 'Students — الطلاب' }} />
            <Stack.Screen name="staff" options={{ title: 'Staff — الموظفين' }} />
            <Stack.Screen name="subjects" options={{ title: 'Subjects — المقررات' }} />
            <Stack.Screen name="groups" options={{ title: 'Groups — المجموعات' }} />
            <Stack.Screen name="announcements" options={{ title: 'Announcements — الإعلانات' }} />
        </Stack>
    );
}
