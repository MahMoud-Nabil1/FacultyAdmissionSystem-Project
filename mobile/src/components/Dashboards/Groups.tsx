import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Modal,
    Share,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// expo-file-system / expo-sharing removed — not linked on Android managed builds.
// CSV sharing is handled via RN's built-in Share API on mobile.

import { useLanguage } from '../../context/LanguageContext';
import { getAllGroups } from '../../services/api';
import CustomHeader from '../common/CustomHeader';
import ScreenContainer from '../common/ScreenContainer';

type GroupType = 'lecture' | 'lab' | 'tutorial' | 'seminar';
type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface IGroup {
    _id: string;
    number: number;
    subject: string;
    type: GroupType;
    from: number;
    to: number;
    day: WeekDay;
    place?: string;
    capacity: number;
    students?: Array<{
        _id?: string;
        studentId?: string;
        name?: string;
    } | string>;
}

const TYPE_STYLE: Record<GroupType, { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    lecture: { bg: '#dbeafe', color: '#1e40af', icon: 'easel-outline' },
    lab: { bg: '#d1fae5', color: '#065f46', icon: 'flask-outline' },
    tutorial: { bg: '#fef3c7', color: '#92400e', icon: 'pencil-outline' },
    seminar: { bg: '#ede9fe', color: '#5b21b6', icon: 'mic-outline' },
};

function formatTime(h: number): string {
    return `${String(h).padStart(2, '0')}:00`;
}

function normalizeStudent(student: { _id?: string; studentId?: string; name?: string } | string) {
    if (typeof student === 'string') {
        return { id: student, name: '' };
    }
    return {
        id: student.studentId || student._id || '',
        name: student.name || '',
    };
}

function buildCsv(group: IGroup) {
    const rows = [["studentId", "name"]];
    (group.students ?? []).forEach(student => {
        const normalized = normalizeStudent(student);
        rows.push([
            normalized.id || '',
            normalized.name || '',
        ]);
    });
    return rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

export default function Groups() {
    const { t } = useLanguage();
    const [groups, setGroups] = useState<IGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const data = await getAllGroups();
                setGroups(data);
            } catch (err: any) {
                Alert.alert(t('common.error'), err.message || t('groupsScreen.errors.fetchFailed'));
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    const openGroupDetails = (group: IGroup) => {
        setSelectedGroup(group);
        setModalVisible(true);
    };

    const handleDownloadCsv = async (group: IGroup) => {
        const csv = buildCsv(group);
        const sanitizedFilename = `${group.subject}-${group.number}-students.csv`.replace(/[^a-zA-Z0-9._-]/g, '_');

        try {
            if (Platform.OS === 'web') {
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = sanitizedFilename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                return;
            }

            // On Android / iOS: share the CSV text directly via the OS share sheet.
            // This requires no native linking and works in Expo managed workflow.
            await Share.share({
                title: sanitizedFilename,
                message: csv,
            });
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.message || t('groupsScreen.shareCsvFailed'));
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    return (
        <ScreenContainer>
            <CustomHeader title={t('groupsScreen.title')} showBack={false} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="albums-outline" size={72} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>{t('groupsScreen.empty.title')}</Text>
                        <Text style={styles.emptySubtitle}>{t('groupsScreen.empty.subtitle')}</Text>
                    </View>
                ) : (
                    groups.map((group) => {
                        const badge = TYPE_STYLE[group.type] || TYPE_STYLE.lecture;
                        return (
                            <TouchableOpacity
                                key={group._id}
                                style={styles.card}
                                activeOpacity={0.85}
                                onPress={() => openGroupDetails(group)}
                            >
                                <View style={styles.topRow}>
                                    <Text style={styles.groupName}>{t('groupsScreen.groupNumber', { number: group.number })}</Text>
                                    <View style={[styles.badge, { backgroundColor: badge.bg }]}
                                    >
                                        <Ionicons name={badge.icon} size={13} color={badge.color} style={{ marginLeft: 4 }} />
                                        <Text style={[styles.badgeText, { color: badge.color }]}>
                                            {t(`groupsScreen.types.${group.type}`)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.subject}>{group.subject}</Text>
                                <View style={styles.divider} />
                                <View style={styles.metaRow}>
                                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                                    <Text style={styles.metaText}>{t(`groupsScreen.days.${group.day}`)}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                                    <Text style={styles.metaText}>
                                        {formatTime(group.from)} – {formatTime(group.to)}
                                    </Text>
                                </View>
                                {group.place && (
                                    <View style={styles.metaRow}>
                                        <Ionicons name="location-outline" size={14} color="#9ca3af" />
                                        <Text style={styles.metaText}>{group.place}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('groupsScreen.detailsTitle')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        {selectedGroup ? (
                            <View>
                                <Text style={styles.modalLabel}>{t('groupsScreen.subject')}:</Text>
                                <Text style={styles.modalValue}>{selectedGroup.subject}</Text>

                                <Text style={styles.modalLabel}>{t('groupsScreen.groupNumberLabel')}:</Text>
                                <Text style={styles.modalValue}>{selectedGroup.number}</Text>

                                <Text style={styles.modalLabel}>{t('groupsScreen.type')}:</Text>
                                <Text style={styles.modalValue}>{t(`groupsScreen.types.${selectedGroup.type}`)}</Text>

                                <Text style={styles.modalLabel}>{t('groupsScreen.schedule')}:</Text>
                                <Text style={styles.modalValue}>{`${t(`groupsScreen.days.${selectedGroup.day}`)} • ${formatTime(selectedGroup.from)} - ${formatTime(selectedGroup.to)}`}</Text>

                                <Text style={styles.modalLabel}>{t('groupsScreen.place')}:</Text>
                                <Text style={styles.modalValue}>{selectedGroup.place || t('groupsScreen.noPlace')}</Text>

                                <Text style={styles.modalLabel}>{t('groupsScreen.capacity')}:</Text>
                                <Text style={styles.modalValue}>{selectedGroup.capacity}</Text>

                                <Text style={styles.modalLabel}>{t('groupsScreen.enrolled')}:</Text>
                                <Text style={styles.modalValue}>{(selectedGroup.students ?? []).length}</Text>

                                {(selectedGroup.students ?? []).length > 0 ? (
                                    <View style={styles.studentsList}>
                                        {(selectedGroup.students ?? []).map((student, index) => {
                                            const normalized = normalizeStudent(student);
                                            return (
                                                <View key={`${normalized.id}-${index}`} style={styles.studentRow}>
                                                    <Text style={styles.studentName}>{normalized.name || normalized.id || t('groupsScreen.studentAnonymous')}</Text>
                                                    {normalized.id ? <Text style={styles.studentId}>{normalized.id}</Text> : null}
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <Text style={styles.emptySubtitle}>{t('groupsScreen.noStudents')}</Text>
                                )}

                                <TouchableOpacity
                                    style={styles.downloadButton}
                                    onPress={() => selectedGroup && handleDownloadCsv(selectedGroup)}
                                >
                                    <Ionicons name="download-outline" size={18} color="#fff" />
                                    <Text style={styles.downloadButtonText}>{t('groupsScreen.downloadCsv')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: '#1a73e8',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    groupName: { fontSize: 16, fontWeight: '700', color: '#1f2937', textAlign: 'right' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    subject: { fontSize: 13, color: '#1a73e8', fontWeight: '600', textAlign: 'right', marginBottom: 12 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 12 },
    metaRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
    metaText: { fontSize: 12, color: '#6b7280', textAlign: 'right', marginRight: 6 },
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#4b5563', marginTop: 10 },
    emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 5 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 12,
    },
    modalValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '600',
    },
    studentsList: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    studentName: {
        fontSize: 14,
        color: '#111827',
    },
    studentId: {
        fontSize: 12,
        color: '#6b7280',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a73e8',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginTop: 20,
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
});