import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';

export default function TabsLayout() {
    const { user } = useAuth();
    const { t } = useLanguage();

    const isStudent = user?.role === 'student';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#1a73e8',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    height: 62,
                    paddingBottom: 10,
                    paddingTop: 6,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.2,
                },
            }}
        >
            {/* ── Home — always visible ── */}
            <Tabs.Screen
                name="home"
                options={{
                    title: t('tabs.home'),
                    tabBarLabel: t('tabs.home'),
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
                    ),
                }}
            />

            {/* ── Groups — student only, visible in tab bar ── */}
            <Tabs.Screen
                name="groups"
                options={{
                    title: t('tabs.groups'),
                    tabBarLabel: t('tabs.groups'),
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
                    ),
                    // hide for non-students
                    tabBarButton: isStudent ? undefined : () => null,
                    tabBarItemStyle: isStudent ? {} : { display: 'none' as const },
                }}
            />

            {/* ── Hidden screens — reachable from home screen cards ── */}
            <Tabs.Screen name="edit"               options={{ href: null }} />
            <Tabs.Screen name="support"            options={{ href: null }} />
            <Tabs.Screen name="register"           options={{ href: null }} />
            <Tabs.Screen name="register-subjects"  options={{ href: null }} />
            <Tabs.Screen name="complaints"         options={{ href: null }} />
            <Tabs.Screen name="advisor"            options={{ href: null }} />
        </Tabs>
    );
}
