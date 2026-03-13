import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
    {
        label: 'Students',
        labelAr: 'الطلاب',
        icon: 'school-outline' as const,
        color: '#3b82f6',
        bg: '#eff6ff',
        route: '/(tabs)/edit/students',
    },
    {
        label: 'Staff',
        labelAr: 'الموظفين',
        icon: 'people-outline' as const,
        color: '#8b5cf6',
        bg: '#f5f3ff',
        route: '/(tabs)/edit/staff',
    },
    {
        label: 'Subjects',
        labelAr: 'المقررات',
        icon: 'book-outline' as const,
        color: '#10b981',
        bg: '#ecfdf5',
        route: '/(tabs)/edit/subjects',
    },
    {
        label: 'Groups',
        labelAr: 'المجموعات',
        icon: 'grid-outline' as const,
        color: '#f59e0b',
        bg: '#fffbeb',
        route: '/(tabs)/edit/groups',
    },
    {
        label: 'Announcements',
        labelAr: 'الإعلانات',
        icon: 'megaphone-outline' as const,
        color: '#ef4444',
        bg: '#fef2f2',
        route: '/(tabs)/edit/announcements',
    },
] as const;

export default function EditPanel() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Admin Panel</Text>
            <Text style={styles.subheading}>اختر القسم الذي تريد تعديله</Text>

            <View style={styles.grid}>
                {SECTIONS.map((s) => (
                    <TouchableOpacity
                        key={s.label}
                        style={[styles.card, { backgroundColor: s.bg, borderColor: s.color + '40' }]}
                        onPress={() => router.push(s.route as any)}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.iconWrap, { backgroundColor: s.color + '20' }]}>
                            <Ionicons name={s.icon} size={30} color={s.color} />
                        </View>
                        <Text style={[styles.cardLabel, { color: s.color }]}>{s.label}</Text>
                        <Text style={styles.cardLabelAr}>{s.labelAr}</Text>
                        <Ionicons name="chevron-forward" size={16} color={s.color} style={styles.arrow} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4ff' },
    content: { padding: 20, paddingBottom: 40 },
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
    cardLabelAr: { fontSize: 12, color: '#6b7280', position: 'absolute', bottom: 10, right: 44 },
    arrow: { marginLeft: 'auto' },
});
