import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

/** Returns tab visibility options — hides tab button when condition is false */
function tabVisibility(visible: boolean) {
    return visible
        ? {}
        : {
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' as const },
        };
}

export default function TabsLayout() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isStudent = user?.role === 'student';

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: '#1a73e8' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                tabBarActiveTintColor: '#1a73e8',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            {/* ── Dashboard — visible to everyone ── */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />

            {/* ── Edit — admin only ── */}
            <Tabs.Screen
                name="edit"
                options={{
                    title: 'Edit',
                    tabBarLabel: 'Edit',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="create-outline" size={size} color={color} />
                    ),
                    ...tabVisibility(isAdmin),
                }}
            />

            {/* ── Groups — student only ── */}
            <Tabs.Screen
                name="groups"
                options={{
                    title: 'Groups',
                    tabBarLabel: 'Groups',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                    ...tabVisibility(isStudent),
                }}
            />

            {/* ── Support — student only ── */}
            <Tabs.Screen
                name="support"
                options={{
                    title: 'Contact Support',
                    tabBarLabel: 'Support',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="headset" size={size} color={color} />
                    ),
                    ...tabVisibility(isStudent),
                }}
            />
        </Tabs>
    );
}

