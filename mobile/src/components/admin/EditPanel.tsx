import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

const SECTIONS = [
    {
        titleKey: 'editPanel.students' as const,
        icon: 'school-outline' as const,
        color: '#3b82f6',
        bg: '#eff6ff',
        route: '/(tabs)/edit/students',
    },
    {
        titleKey: 'editPanel.staff' as const,
        icon: 'people-outline' as const,
        color: '#3b82f6',
        bg: '#eff6ff',
        route: '/(tabs)/edit/staff',
    },
    {
        titleKey: 'editPanel.subjects' as const,
        icon: 'book-outline' as const,
        color: '#3b82f6',
        bg: '#eff6ff',
        route: '/(tabs)/edit/subjects',
    },
    {
        titleKey: 'editPanel.groups' as const,
        icon: 'grid-outline' as const,
        color: '#3b82f6',
        bg: '#eff6ff',
        route: '/(tabs)/edit/groups',
    },
    {
        titleKey: 'editPanel.announcements' as const,
        icon: 'megaphone-outline' as const,
        color: '#3b82f6',
        bg: '#eff6ff',
        route: '/(tabs)/edit/announcements',
    },
] as const;

export default function EditPanel() {
    const { t } = useLanguage();
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.heading}>{t('editPanel.title')}</Text>
            <Text style={styles.subheading}>{t('editPanel.subtitle')}</Text>

            <View style={styles.grid}>
                {SECTIONS.map((s) => (
                    <TouchableOpacity
                        key={s.titleKey}
                        style={[styles.card, { backgroundColor: s.bg, borderColor: s.color + '40' }]}
                        onPress={() => router.push(s.route as any)}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.iconWrap, { backgroundColor: s.color + '20' }]}>
                            <Ionicons name={s.icon} size={30} color={s.color} />
                        </View>
                        <Text style={[styles.cardLabel, { color: s.color }]}>{t(s.titleKey)}</Text>
                        <Ionicons name="chevron-forward" size={16} color={s.color} style={styles.arrow} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    content: { padding: 20, paddingTop: 90, paddingBottom: 40 },
    heading: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a73e8',
        textAlign: 'center',
        marginBottom: 4,
    },
    subheading: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    grid: { gap: 14 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1.5,
        padding: 16,
        gap: 14,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardLabel: { fontSize: 16, fontWeight: '700', flex: 1 },
    arrow: { marginLeft: 'auto' },
});
