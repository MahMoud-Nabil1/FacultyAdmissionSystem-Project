
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import AiChatBox from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import AiChatBox from '../../src/components/common/AiChatBox'; // Add this import

export default function TabsLayout() {
    const { user } = useAuth();
    const { t } = useLanguage();

    const isStudent = user?.role === 'student';
    const isStaff = user?.role === 'academic_guide' || user?.role === 'academic_guide_coordinator' || user?.role === 'admin';

    return (
        <>
            {/* Your existing tabs */}
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
                        tabBarButton: isStudent ? undefined : () => null,
                        tabBarItemStyle: isStudent ? {} : { display: 'none' as const },
                    }}
                />

                {/* ── Admin / Staff panel — visible in tab bar for staff ── */}
                <Tabs.Screen
                    name="edit"
                    options={{
                        title: t('tabs.edit'),
                        tabBarLabel: t('tabs.edit'),
                        tabBarIcon: ({ color, size, focused }) => (
                            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
                        ),
                        tabBarButton: isStaff ? undefined : () => null,
                        tabBarItemStyle: isStaff ? {} : { display: 'none' as const },
                    }}
                />

                {/* ── Hidden screens — reachable from home screen cards ── */}
                <Tabs.Screen name="support"            options={{ href: null }} />
                <Tabs.Screen name="register"           options={{ href: null }} />
                <Tabs.Screen name="register-subjects"  options={{ href: null }} />
                <Tabs.Screen name="complaints"         options={{ href: null }} />
                <Tabs.Screen name="advisor"            options={{ href: null }} />
            </Tabs>

            {/* AI Chat Box - Floating button over everything */}
            <AiChatBox />
        </>
    );
}

