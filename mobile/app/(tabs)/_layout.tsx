import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';

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
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin';
    const isCoordinator = user?.role === 'academic_guide_coordinator';
    const isStudent = user?.role === 'student';
    const isAcademicGuide = user?.role === 'academic_guide' || user?.role === 'academic_guide_coordinator';
    const isReporter = user?.role === 'reporter';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                headerTitle: '',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#ffffff' },
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
            {/* ── Home — visible to everyone ── */}
            <Tabs.Screen
                name="home"
                options={{
                    title: t('tabs.home'),
                    tabBarLabel: t('tabs.home'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />

            {/* ── Edit — admin only ── */}
            <Tabs.Screen
                name="edit"
                options={{
                    title: t('tabs.edit'),
                    tabBarLabel: t('tabs.edit'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="create-outline" size={size} color={color} />
                    ),
                    ...tabVisibility(isAdmin || isCoordinator),
                }}
            />

            {/* ── Groups — student only ── */}
            <Tabs.Screen
                name="groups"
                options={{
                    title: t('tabs.groups'),
                    tabBarLabel: t('tabs.groups'),
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
                    title: t('tabs.support'),
                    tabBarLabel: t('tabs.support'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="headset" size={size} color={color} />
                    ),
                    ...tabVisibility(isStudent),
                }}
            />

            {/* ── Register Subjects — student only (hidden from tab bar, accessed via home) ── */}
            <Tabs.Screen
                name="register-subjects"
                options={{
                    href: null,
                }}
            />

            {/* ── Advisor — academic guide only (hidden from tab bar, accessed via home) ── */}
            <Tabs.Screen
                name="advisor"
                options={{
                    href: null,
                }}
            />

            {/* ── Register — student only ── */}
            <Tabs.Screen
                name="register"
                options={{
                    title: t('tabs.register'),
                    tabBarLabel: t('tabs.register'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text" size={size} color={color} />
                    ),
                    ...tabVisibility(isStudent),
                }}
            />

            {/* ── Complaints — student only ── */}
            <Tabs.Screen
                name="complaints"
                options={{
                    title: t('tabs.complaints'),
                    tabBarLabel: t('tabs.complaints'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble-ellipses" size={size} color={color} />
                    ),
                    ...tabVisibility(isStudent),
                }}
            />
        </Tabs>
    );
}

