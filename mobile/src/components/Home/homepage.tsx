import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../common/CustomHeader';
import ScreenContainer from '../common/ScreenContainer';

/* ─────────── constants ─────────── */
const { width } = Dimensions.get('window');
const H_PAD   = 20;
const GAP     = 14;
const CARD_W  = (width - H_PAD * 2 - GAP) / 2;
const ACCENT  = '#1a73e8';

/* ─────────── types ─────────── */
interface MenuEntry {
    labelKey: string;                                         // key inside `home.*`
    icon: React.ComponentProps<typeof Ionicons>['name'];
    route: string;
}

/* ─────────── menu tables ─────────── */
//  First entry → featured full-width card
//  Rest        → 2-column grid rows

const STUDENT_MENU: MenuEntry[] = [
    { labelKey: 'registerSubjects', icon: 'book',                route: '/(tabs)/register'    },
    { labelKey: 'announcements',    icon: 'megaphone-outline',   route: '/announcements-view' },
    { labelKey: 'academicHistory',  icon: 'school-outline',      route: '/academic-history'   },
    { labelKey: 'support',          icon: 'headset-outline',     route: '/(tabs)/support'     },
    { labelKey: 'complaints',       icon: 'chatbubble-ellipses', route: '/(tabs)/complaints'  },
];

const GUIDE_MENU: MenuEntry[] = [
    { labelKey: 'studentsList',  icon: 'people',            route: '/advisor'            },
    { labelKey: 'announcements', icon: 'megaphone-outline', route: '/announcements-view' },
];

const COORDINATOR_MENU: MenuEntry[] = [
    { labelKey: 'studentsList',     icon: 'people',             route: '/advisor'              },
    { labelKey: 'announcements',    icon: 'megaphone-outline',  route: '/announcements-view'   },
    { labelKey: 'groupsManagement', icon: 'grid-outline',       route: '/(tabs)/edit/groups'   },
    { labelKey: 'complaints',       icon: 'mail-unread-outline',route: '/admin-complaints'     },
];

const REPORTER_MENU: MenuEntry[] = [
    { labelKey: 'statistics',    icon: 'stats-chart',       route: '/reports'            },
    { labelKey: 'announcements', icon: 'megaphone-outline', route: '/announcements-view' },
];

const ADMIN_MENU: MenuEntry[] = [
    { labelKey: 'statistics',    icon: 'stats-chart',       route: '/reports'            },
    { labelKey: 'announcements', icon: 'megaphone-outline', route: '/announcements-view' },
    { labelKey: 'complaints',    icon: 'mail-unread',       route: '/admin-complaints'   },
];

const MENUS: Record<string, MenuEntry[]> = {
    student:                    STUDENT_MENU,
    academic_guide:             GUIDE_MENU,
    academic_guide_coordinator: COORDINATOR_MENU,
    reporter:                   REPORTER_MENU,
    admin:                      ADMIN_MENU,
};

/* ─────────── component ─────────── */
const Homepage = () => {
    const { token, logout, user, updateUser } = useAuth();
    const { t, locale }           = useLanguage();
    const isRTL                   = locale === 'ar';

    const [fullData, setFullData] = useState<any>(null);
    const [loading,  setLoading]  = useState(true);
    const [uploading, setUploading] = useState(false);

    const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:5000/api';

    /* fetch profile */
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res  = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok) {
                    setFullData(data);
                    updateUser(data);
                }
            } catch {
                Alert.alert(t('common.error'), t('home.serverError'));
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const handleAvatarUpload = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('common.error'), t('home.cameraPermissionError') || 'Camera roll permissions are required to upload an avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            if (!asset.base64) {
                Alert.alert(t('common.error'), t('home.avatarError'));
                return;
            }

            const base64Image = `data:image/jpeg;base64,${asset.base64}`;
            setUploading(true);
            try {
                const res = await fetch(`${API_BASE}/users/avatar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ avatar: base64Image }),
                });

                const data = await res.json();
                if (res.ok) {
                    const updatedUser = { ...fullData, avatar: data.avatarUrl };
                    setFullData(updatedUser);
                    updateUser(updatedUser);
                    Alert.alert(t('common.success'), t('home.avatarUpdated'));
                } else {
                    Alert.alert(t('common.error'), data.error || t('home.avatarError'));
                }
            } catch (err) {
                console.error("Avatar upload failed:", err);
                Alert.alert(t('common.error'), t('home.avatarError'));
            } finally {
                setUploading(false);
            }
        }
    };

    /* logout dialog */
    const handleLogout = () =>
        Alert.alert(t('home.logoutTitle'), t('home.logoutMessage'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('home.logoutConfirm'),
                style: 'destructive',
                onPress: async () => { await logout(); router.replace('/(auth)/login'); },
            },
        ]);

    /* ── loading state ── */
    if (loading) {
        return (
            <ScreenContainer>
                <CustomHeader title="" showBack={false} />
                <View style={s.center}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            </ScreenContainer>
        );
    }

    /* ── build menu ── */
    const role    = user?.role ?? 'student';
    const entries = MENUS[role] ?? STUDENT_MENU;
    const [featured, ...rest] = entries;

    // chunk rest into rows of 2
    const rows: MenuEntry[][] = [];
    for (let i = 0; i < rest.length; i += 2) rows.push(rest.slice(i, i + 2));

    const name = fullData?.name || user?.name || '';

    /* ── render ── */
    return (
        <ScreenContainer>
            {/* header: user name on top, logout icon right */}
            <CustomHeader
                title={name}
                showBack={false}
                rightElement={
                    <TouchableOpacity
                        onPress={handleLogout}
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                    >
                        <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Profile card ── */}
                <View style={s.profileCard}>
                    {/* avatar */}
                    <TouchableOpacity 
                        style={s.avatar} 
                        onPress={handleAvatarUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            fullData?.avatar ? (
                                <Image 
                                    source={{ uri: fullData.avatar }} 
                                    style={s.avatarImage} 
                                />
                            ) : (
                                <Text style={s.avatarLetter}>
                                    {name.trim() ? name.trim()[0].toUpperCase() : '?'}
                                </Text>
                            )
                        )}
                        <View style={s.cameraBadge}>
                            <Ionicons name="camera" size={12} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* name */}
                    <Text style={s.profileName}>{name}</Text>
                    <TouchableOpacity onPress={handleAvatarUpload} disabled={uploading}>
                        <Text style={s.uploadText}>
                            {uploading ? t('home.loading') : t('home.uploadAvatar')}
                        </Text>
                    </TouchableOpacity>

                    {/* student stats */}
                    {role === 'student' && (
                        <View style={[s.statsRow, isRTL && s.rowReverse]}>
                            <View style={s.statCell}>
                                <Text style={s.statNum}>{fullData?.completedHours ?? '0'}</Text>
                                <Text style={s.statLabel}>{t('home.hours')}</Text>
                            </View>
                            <View style={s.statSep} />
                            <View style={s.statCell}>
                                <Text style={s.statNum}>{fullData?.gpa ?? '0.0'}</Text>
                                <Text style={s.statLabel}>{t('home.gpa')}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Section title ── */}
                <Text style={[s.sectionTitle, isRTL && s.textRight]}>
                    {t('home.servicesTitle')}
                </Text>

                {/* ── Featured card (full width) ── */}
                <TouchableOpacity
                    style={[s.featuredCard, isRTL && s.rowReverse]}
                    onPress={() => router.push(featured.route as any)}
                    activeOpacity={0.75}
                >
                    <View style={s.featuredIconWrap}>
                        <Ionicons name={featured.icon} size={32} color={ACCENT} />
                    </View>
                    <Text style={[s.featuredLabel, isRTL && s.textRight]}>
                        {t(`home.${featured.labelKey}`)}
                    </Text>
                    <Ionicons
                        name={isRTL ? 'chevron-back' : 'chevron-forward'}
                        size={20}
                        color="#9ca3af"
                    />
                </TouchableOpacity>

                {/* ── 2-column grid ── */}
                {rows.map((row, ri) => (
                    <View key={ri} style={[s.gridRow, isRTL && s.rowReverse]}>
                        {row.map((entry) => (
                            <TouchableOpacity
                                key={entry.labelKey}
                                style={s.gridCard}
                                onPress={() => router.push(entry.route as any)}
                                activeOpacity={0.75}
                            >
                                <View style={s.gridIconWrap}>
                                    <Ionicons name={entry.icon} size={28} color={ACCENT} />
                                </View>
                                <Text style={s.gridLabel} numberOfLines={2}>
                                    {t(`home.${entry.labelKey}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {/* empty filler when row has only 1 item */}
                        {row.length === 1 && <View style={s.gridCard} pointerEvents="none" />}
                    </View>
                ))}

                {/* ── Sign out (secondary) ── */}
                <TouchableOpacity style={[s.logoutRow, isRTL && s.rowReverse]} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={17} color="#ef4444" />
                    <Text style={s.logoutLabel}>{t('home.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenContainer>
    );
};

/* ─────────── styles ─────────── */
const CARD_BASE = {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    borderBottomWidth: 3,
    borderBottomColor: ACCENT,
};

const s = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    scroll: {
        paddingHorizontal: H_PAD,
        paddingTop: 20,
        paddingBottom: 48,
    },

    /* ── Profile card ── */
    profileCard: {
        ...CARD_BASE,
        borderBottomWidth: 0,           // no blue underline on profile
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 0,
    },
    avatar: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: ACCENT,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 10,
    },
    avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '800' },
    avatarImage: { width: 70, height: 70, borderRadius: 35 },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: ACCENT,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    uploadText: {
        fontSize: 12,
        color: ACCENT,
        fontWeight: '600',
        marginTop: 4,
    },
    profileName:  { fontSize: 17, fontWeight: '700', color: '#1f2937', textAlign: 'center' },

    statsRow: {
        flexDirection: 'row',
        marginTop: 16, paddingTop: 14,
        borderTopWidth: 1, borderTopColor: '#f0f0f0',
        width: '100%',
    },
    statCell:  { flex: 1, alignItems: 'center' },
    statNum:   { fontSize: 20, fontWeight: '800', color: ACCENT },
    statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
    statSep:   { width: 1, backgroundColor: '#f0f0f0' },

    /* ── Section heading ── */
    sectionTitle: {
        fontSize: 15, fontWeight: '700',
        color: '#374151', marginBottom: 12, letterSpacing: 0.2,
    },

    /* ── Featured card ── */
    featuredCard: {
        ...CARD_BASE,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 20,
        marginBottom: GAP,
        gap: 14,
    },
    featuredIconWrap: {
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: '#e8f0fe',
        justifyContent: 'center', alignItems: 'center',
    },
    featuredLabel: {
        flex: 1,
        fontSize: 16, fontWeight: '800',
        color: '#1f2937',
    },

    /* ── 2-column grid ── */
    gridRow: {
        flexDirection: 'row',
        gap: GAP,
        marginBottom: GAP,
    },
    gridCard: {
        ...CARD_BASE,
        width: CARD_W,
        paddingVertical: 22,
        paddingHorizontal: 10,
        alignItems: 'center',
        gap: 10,
    },
    gridIconWrap: {
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: '#e8f0fe',
        justifyContent: 'center', alignItems: 'center',
    },
    gridLabel: {
        fontSize: 13, fontWeight: '700',
        color: '#374151', textAlign: 'center', lineHeight: 18,
    },

    /* ── Logout row ── */
    logoutRow: {
        flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: 6, marginTop: 20, paddingVertical: 10,
    },
    logoutLabel: { color: '#ef4444', fontWeight: '700', fontSize: 14 },

    /* ── RTL helpers ── */
    rowReverse: { flexDirection: 'row-reverse' },
    textRight:  { textAlign: 'right' },
});

export default Homepage;