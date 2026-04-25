import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Switch, RefreshControl,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../common/CustomHeader';
import ScreenContainer from '../../common/ScreenContainer';
import { apiGet, apiPut, getAnnouncementSettings, updateAnnouncementSettings } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';

interface Settings { registrationOpen: boolean; withdrawalOpen: boolean; }

const LEVELS = ['1', '2', '3', '4'];

export default function RegistrationControlScreen() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const readOnly = user?.role === 'academic_guide' || user?.role === 'academic_guide_coordinator';
    const [settings, setSettings] = useState<Settings>({ registrationOpen: false, withdrawalOpen: false });
    const [gpaMin, setGpaMin] = useState('2.5');
    const [gpaMax, setGpaMax] = useState('5.0');
    const [selectedLevels, setSelectedLevels] = useState<string[]>(['1', '2', '3', '4']);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [savingGpa, setSavingGpa] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const [{ res, data }, announcementData] = await Promise.all([
                apiGet('/settings', false),
                getAnnouncementSettings().catch(() => ({ gpaMin: 2.5, gpaMax: 5, level: ['1', '2', '3', '4'] })),
            ]);
            if (res.ok) {
                const s = data as any;
                setSettings({ registrationOpen: !!s.registrationOpen, withdrawalOpen: !!s.withdrawalOpen });
            }
            setGpaMin(String(announcementData.gpaMin ?? 2.5));
            setGpaMax(String(announcementData.gpaMax ?? 5));
            setSelectedLevels(Array.isArray(announcementData.level) ? announcementData.level : ['1', '2', '3', '4']);
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const handleToggle = async (field: keyof Settings) => {
        setToggling(field);
        try {
            const newSettings = { ...settings, [field]: !settings[field] };
            const { res, data } = await apiPut('/settings', newSettings as unknown as Record<string, unknown>);
            if (!res.ok) throw new Error((data as any).error || t('registration.updateFailed'));
            const s = data as any;
            setSettings({ registrationOpen: !!s.registrationOpen, withdrawalOpen: !!s.withdrawalOpen });
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        } finally {
            setToggling(null);
        }
    };

    const toggleLevel = (level: string) => {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? (prev.length > 1 ? prev.filter(l => l !== level) : prev)
                : [...prev, level].sort()
        );
    };

    const handleSaveGpa = async () => {
        const min = parseFloat(gpaMin);
        const max = parseFloat(gpaMax);
        if (isNaN(min) || isNaN(max)) { Alert.alert(t('common.error'), t('registration.gpaInvalid')); return; }
        if (min >= max) { Alert.alert(t('common.error'), t('registration.gpaMinMax')); return; }
        if (min < 0 || max > 5) { Alert.alert(t('common.error'), t('registration.gpaRange')); return; }
        setSavingGpa(true);
        try {
            await updateAnnouncementSettings({ gpaMin: min, gpaMax: max, level: selectedLevels });
            Alert.alert(t('common.success'), t('registration.gpaSaved'));
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message);
        } finally {
            setSavingGpa(false);
        }
    };

    const StatusBadge = ({ open }: { open: boolean }) => (
        <View style={[styles.badge, open ? styles.badgeOpen : styles.badgeClosed]}>
            <Ionicons name={open ? 'checkmark-circle' : 'close-circle'} size={14} color="#fff" />
            <Text style={styles.badgeText}>{open ? t('registration.open') : t('registration.closed')}</Text>
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#1a73e8" /></View>;
    }

    return (
        <ScreenContainer>
            <CustomHeader title={t('registration.title')} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} tintColor="#1a73e8" />}
            >
            <Text style={styles.subtitle}>{t('registration.subtitle')}</Text>

            {/* ── Toggle Cards ── */}
            {([
                { field: 'registrationOpen' as const, icon: 'document-text-outline' as const, label: t('registration.registrationStatus') },
                { field: 'withdrawalOpen' as const,   icon: 'exit-outline' as const,          label: t('registration.withdrawalStatus') },
            ]).map(({ field, icon, label }) => (
                <View key={field} style={styles.card}>
                    <View style={styles.cardLeft}>
                        <View style={[styles.iconWrap, { backgroundColor: settings[field] ? '#dcfce7' : '#fee2e2' }]}>
                            <Ionicons name={icon} size={26} color={settings[field] ? '#16a34a' : '#dc2626'} />
                        </View>
                        <View style={styles.cardText}>
                            <Text style={styles.cardLabel}>{label}</Text>
                            <StatusBadge open={settings[field]} />
                        </View>
                    </View>
                    {readOnly
                        ? <View style={[styles.badge, styles.badgeClosed]}><Text style={styles.badgeText}>{t('common.viewOnly')}</Text></View>
                        : toggling === field
                            ? <ActivityIndicator color="#dc2626" />
                            : <Switch
                                value={settings[field]}
                                onValueChange={() => handleToggle(field)}
                                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                                thumbColor={settings[field] ? '#16a34a' : '#9ca3af'}
                            />
                    }
                </View>
            ))}

            {/* ── GPA Range ── */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('registration.gpaRange')}</Text>
                <View style={styles.gpaRow}>
                    <View style={styles.gpaField}>
                        <Text style={styles.gpaLabel}>{t('registration.gpaMin')}</Text>
                        <TextInput
                            style={[styles.gpaInput, readOnly && styles.inputDisabled]}
                            value={gpaMin}
                            onChangeText={readOnly ? undefined : setGpaMin}
                            keyboardType="decimal-pad"
                            placeholder="0.0"
                            placeholderTextColor="#9ca3af"
                            editable={!readOnly}
                        />
                    </View>
                    <Ionicons name="remove-outline" size={20} color="#9ca3af" style={{ marginTop: 28 }} />
                    <View style={styles.gpaField}>
                        <Text style={styles.gpaLabel}>{t('registration.gpaMax')}</Text>
                        <TextInput
                            style={[styles.gpaInput, readOnly && styles.inputDisabled]}
                            value={gpaMax}
                            onChangeText={readOnly ? undefined : setGpaMax}
                            keyboardType="decimal-pad"
                            placeholder="5.0"
                            placeholderTextColor="#9ca3af"
                            editable={!readOnly}
                        />
                    </View>
                </View>

                {/* ── Available Levels ── */}
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('registration.availableLevels')}</Text>
                <View style={styles.levelRow}>
                    {LEVELS.map(level => (
                        <TouchableOpacity
                            key={level}
                            style={[styles.levelBtn, selectedLevels.includes(level) && styles.levelBtnActive, readOnly && styles.levelBtnDisabled]}
                            onPress={readOnly ? undefined : () => toggleLevel(level)}
                            disabled={readOnly}
                        >
                            <Text style={[styles.levelBtnText, selectedLevels.includes(level) && styles.levelBtnTextActive]}>
                                {t('registration.level')} {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {!readOnly && (
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGpa} disabled={savingGpa}>
                        {savingGpa
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.saveBtnText}>{t('registration.saveGpa')}</Text>
                        }
                    </TouchableOpacity>
                )}
            </View>

            {/* Info note */}
            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
                <Text style={styles.infoText}>{t('registration.infoNote')}</Text>
            </View>
        </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    subtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24 },

    card: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        borderLeftWidth: 4, borderLeftColor: '#1a73e8',
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardText: { gap: 6 },
    cardLabel: { fontSize: 15, fontWeight: '700', color: '#111' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
    badgeOpen: { backgroundColor: '#16a34a' },
    badgeClosed: { backgroundColor: '#dc2626' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 12 },

    gpaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    gpaField: { flex: 1, gap: 4 },
    gpaLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
    gpaInput: {
        borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
        padding: 11, fontSize: 16, fontWeight: '700', color: '#111',
        backgroundColor: '#fafafa', textAlign: 'center',
    },

    levelRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
    levelBtn: {
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1.5, borderColor: '#d1d5db', backgroundColor: '#f9fafb',
    },
    levelBtnActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
    levelBtnText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
    levelBtnTextActive: { color: '#fff' },

    saveBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 13, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, marginTop: 4 },
    infoText: { flex: 1, fontSize: 12, color: '#6b7280', lineHeight: 18 },

    inputDisabled: { backgroundColor: '#e5e7eb', color: '#9ca3af' },
    levelBtnDisabled: { opacity: 0.6 },
});
