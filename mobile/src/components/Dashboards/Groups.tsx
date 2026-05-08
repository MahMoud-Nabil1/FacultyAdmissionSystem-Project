import React, { useCallback, useEffect, useState } from 'react';
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
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAllGroups, apiGet, apiPost, apiDelete } from '../../services/api';
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
    students?: Array<{ _id?: string; studentId?: string; name?: string } | string>;
}

interface IRequest {
    _id: string;
    group: string | IGroup;
    status: 'pending' | 'approved' | 'rejected';
}

interface ISettings {
    registrationOpen: boolean;
    withdrawalOpen: boolean;
}

const TYPE_STYLE: Record<GroupType, { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    lecture:  { bg: '#dbeafe', color: '#1e40af', icon: 'easel-outline'  },
    lab:      { bg: '#d1fae5', color: '#065f46', icon: 'flask-outline'  },
    tutorial: { bg: '#fef3c7', color: '#92400e', icon: 'pencil-outline' },
    seminar:  { bg: '#ede9fe', color: '#5b21b6', icon: 'mic-outline'    },
};

function formatTime(h: number): string {
    return `${String(h).padStart(2, '0')}:00`;
}

function normalizeStudent(s: { _id?: string; studentId?: string; name?: string } | string) {
    if (typeof s === 'string') return { id: s, name: '' };
    return { id: s.studentId || s._id || '', name: s.name || '' };
}

function getGroupId(g: string | IGroup): string {
    return typeof g === 'object' ? g._id : g;
}

function buildCsv(group: IGroup) {
    const rows = [['studentId', 'name']];
    (group.students ?? []).forEach(s => {
        const n = normalizeStudent(s);
        rows.push([n.id, n.name]);
    });
    return rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

export default function Groups() {
    const { t } = useLanguage();
    const { user, token } = useAuth();

    const isStudent = user?.role === 'student';
    const userId    = user?.id || user?._id || '';

    const [groups,    setGroups]    = useState<IGroup[]>([]);
    const [myRequests, setMyRequests] = useState<IRequest[]>([]);
    const [settings,  setSettings]  = useState<ISettings>({ registrationOpen: true, withdrawalOpen: true });
    const [loading,   setLoading]   = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null);
    const [modalVisible,  setModalVisible]  = useState(false);

    /* ── fetch ── */
    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [groupsData, settingsRes] = await Promise.all([
                getAllGroups(),
                apiGet('/settings', false).catch(() => ({ res: { ok: false }, data: {} })),
            ]);
            setGroups(groupsData ?? []);
            if (settingsRes.res.ok) {
                const d = settingsRes.data as any;
                setSettings({
                    registrationOpen: d.registrationOpen ?? true,
                    withdrawalOpen:   d.withdrawalOpen   ?? true,
                });
            }
            if (isStudent) {
                const reqRes = await apiGet('/groups/my-requests').catch(() => ({ res: { ok: false }, data: [] }));
                if (reqRes.res.ok) setMyRequests((reqRes.data as IRequest[]) ?? []);
            }
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t('groupsScreen.errors.fetchFailed'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isStudent, t]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const onRefresh = () => { setRefreshing(true); fetchAll(true); };

    /* ── helpers ── */
    const isEnrolled = (group: IGroup) =>
        (group.students ?? []).some(s => {
            const n = normalizeStudent(s);
            return n.id === userId || n.id === user?.studentId?.toString();
        });

    const getRequest = (group: IGroup) =>
        myRequests.find(r => getGroupId(r.group) === group._id);

    const isFull = (group: IGroup) =>
        (group.students ?? []).length >= group.capacity;

    /* ── actions ── */
    const handleJoin = async (group: IGroup) => {
        setActionLoading(group._id);
        try {
            const { res, data } = await apiPost(`/groups/${group._id}/request`, {});
            if (res.ok) {
                await fetchAll(true);
            } else {
                Alert.alert(t('common.error'), (data as any).error || t('register.failed'));
            }
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLeave = async (group: IGroup) => {
        setActionLoading(group._id);
        try {
            const { res, data } = await apiDelete(`/groups/${group._id}/students/me`);
            if (res.ok) {
                await fetchAll(true);
            } else {
                Alert.alert(t('common.error'), (data as any).error || t('register.failed'));
            }
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelRequest = async (requestId: string, groupId: string) => {
        setActionLoading(groupId);
        try {
            const { res, data } = await apiDelete(`/groups/requests/${requestId}`);
            if (res.ok) {
                await fetchAll(true);
            } else {
                Alert.alert(t('common.error'), (data as any).error || t('register.failed'));
            }
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message);
        } finally {
            setActionLoading(null);
        }
    };

    /* ── action button renderer ── */
    const renderActionButton = (group: IGroup) => {
        if (!isStudent) return null;

        const busy    = actionLoading === group._id;
        const enrolled = isEnrolled(group);
        const request  = getRequest(group);
        const full     = isFull(group);

        if (enrolled) {
            return (
                <TouchableOpacity
                    style={[styles.actionBtn, styles.leaveBtn, !settings.withdrawalOpen && styles.disabledBtn]}
                    disabled={busy || !settings.withdrawalOpen}
                    onPress={() => handleLeave(group)}
                >
                    {busy
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.actionBtnText}>{t('register.removeBtn')}</Text>
                    }
                </TouchableOpacity>
            );
        }

        if (request) {
            if (request.status === 'rejected') {
                return (
                    <View style={[styles.actionBtn, styles.rejectedBtn]}>
                        <Text style={styles.rejectedBtnText}>{t('register.status.rejected')}</Text>
                    </View>
                );
            }
            return (
                <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    disabled={busy}
                    onPress={() => handleCancelRequest(request._id, group._id)}
                >
                    {busy
                        ? <ActivityIndicator size="small" color="#c53030" />
                        : <Text style={styles.cancelBtnText}>{t('register.cancelRequestBtn')}</Text>
                    }
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={[styles.actionBtn, styles.joinBtn, (!settings.registrationOpen) && styles.disabledBtn]}
                disabled={busy || !settings.registrationOpen}
                onPress={() => handleJoin(group)}
            >
                {busy
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.actionBtnText}>
                        {full ? t('groupsScreen.waitlist') : t('register.requestBtn')}
                      </Text>
                }
            </TouchableOpacity>
        );
    };

    /* ── CSV download ── */
    const handleDownloadCsv = async (group: IGroup) => {
        const csv = buildCsv(group);
        const filename = `${group.subject}-${group.number}-students.csv`.replace(/[^a-zA-Z0-9._-]/g, '_');
        try {
            if (Platform.OS === 'web') {
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url  = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url; link.download = filename;
                document.body.appendChild(link); link.click();
                document.body.removeChild(link); URL.revokeObjectURL(url);
                return;
            }
            await Share.share({ title: filename, message: csv });
        } catch (err: any) {
            Alert.alert(t('common.error'), err?.message || t('groupsScreen.shareCsvFailed'));
        }
    };

    /* ── loading ── */
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    /* ── render ── */
    return (
        <ScreenContainer>
            <CustomHeader title={t('groupsScreen.title')} showBack={false} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Registration closed banner for students */}
                {isStudent && !settings.registrationOpen && (
                    <View style={styles.banner}>
                        <Text style={styles.bannerText}>{t('register.closed')} — {t('register.closedMessage')}</Text>
                    </View>
                )}

                {groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="albums-outline" size={72} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>{t('groupsScreen.empty.title')}</Text>
                        <Text style={styles.emptySubtitle}>{t('groupsScreen.empty.subtitle')}</Text>
                    </View>
                ) : (
                    groups.map((group) => {
                        const badge    = TYPE_STYLE[group.type] || TYPE_STYLE.lecture;
                        const enrolled = isEnrolled(group);
                        const request  = getRequest(group);
                        const full     = isFull(group);

                        return (
                            <TouchableOpacity
                                key={group._id}
                                style={[styles.card, enrolled && styles.cardEnrolled]}
                                activeOpacity={0.85}
                                onPress={() => { setSelectedGroup(group); setModalVisible(true); }}
                            >
                                <View style={styles.topRow}>
                                    <Text style={styles.groupName}>
                                        {t('groupsScreen.groupNumber', { number: group.number })}
                                    </Text>
                                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                                        <Ionicons name={badge.icon} size={13} color={badge.color} style={{ marginLeft: 4 }} />
                                        <Text style={[styles.badgeText, { color: badge.color }]}>
                                            {t(`groupsScreen.types.${group.type}`)}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.subject}>{group.subject.toUpperCase()}</Text>
                                <View style={styles.divider} />

                                <View style={styles.metaRow}>
                                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                                    <Text style={styles.metaText}>{t(`groupsScreen.days.${group.day}`)}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                                    <Text style={styles.metaText}>{formatTime(group.from)} – {formatTime(group.to)}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="people-outline" size={14} color="#9ca3af" />
                                    <Text style={[styles.metaText, full && styles.fullText]}>
                                        {(group.students ?? []).length} / {group.capacity}
                                        {full ? ` (${t('registerSubjects.full')})` : ''}
                                    </Text>
                                </View>
                                {group.place && (
                                    <View style={styles.metaRow}>
                                        <Ionicons name="location-outline" size={14} color="#9ca3af" />
                                        <Text style={styles.metaText}>{group.place}</Text>
                                    </View>
                                )}

                                {/* Status badge for students */}
                                {isStudent && enrolled && (
                                    <View style={styles.enrolledBadge}>
                                        <Text style={styles.enrolledBadgeText}>✓ {t('register.status.enrolled')}</Text>
                                    </View>
                                )}
                                {isStudent && request && !enrolled && (
                                    <View style={[styles.enrolledBadge,
                                        request.status === 'pending'  ? styles.pendingBadge  :
                                        request.status === 'rejected' ? styles.rejectedBadge : styles.enrolledBadge
                                    ]}>
                                        <Text style={styles.enrolledBadgeText}>
                                            {t(`register.status.${request.status}`)}
                                        </Text>
                                    </View>
                                )}

                                {/* Action button */}
                                <View style={styles.actionRow}>
                                    {renderActionButton(group)}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* ── Detail Modal ── */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <ScrollView>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('groupsScreen.detailsTitle')}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>

                            {selectedGroup && (
                                <View>
                                    <Text style={styles.modalLabel}>{t('groupsScreen.subject')}:</Text>
                                    <Text style={styles.modalValue}>{selectedGroup.subject.toUpperCase()}</Text>

                                    <Text style={styles.modalLabel}>{t('groupsScreen.groupNumberLabel')}:</Text>
                                    <Text style={styles.modalValue}>{selectedGroup.number}</Text>

                                    <Text style={styles.modalLabel}>{t('groupsScreen.type')}:</Text>
                                    <Text style={styles.modalValue}>{t(`groupsScreen.types.${selectedGroup.type}`)}</Text>

                                    <Text style={styles.modalLabel}>{t('groupsScreen.schedule')}:</Text>
                                    <Text style={styles.modalValue}>
                                        {`${t(`groupsScreen.days.${selectedGroup.day}`)} • ${formatTime(selectedGroup.from)} – ${formatTime(selectedGroup.to)}`}
                                    </Text>

                                    <Text style={styles.modalLabel}>{t('groupsScreen.place')}:</Text>
                                    <Text style={styles.modalValue}>{selectedGroup.place || t('groupsScreen.noPlace')}</Text>

                                    <Text style={styles.modalLabel}>{t('groupsScreen.capacity')}:</Text>
                                    <Text style={styles.modalValue}>{selectedGroup.capacity}</Text>

                                    <Text style={styles.modalLabel}>{t('groupsScreen.enrolled')}:</Text>
                                    <Text style={styles.modalValue}>{(selectedGroup.students ?? []).length}</Text>

                                    {(selectedGroup.students ?? []).length > 0 ? (
                                        <View style={styles.studentsList}>
                                            {(selectedGroup.students ?? []).map((s, i) => {
                                                const n = normalizeStudent(s);
                                                return (
                                                    <View key={`${n.id}-${i}`} style={styles.studentRow}>
                                                        <Text style={styles.studentName}>{n.name || n.id || t('groupsScreen.studentAnonymous')}</Text>
                                                        {n.id ? <Text style={styles.studentId}>{n.id}</Text> : null}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <Text style={styles.emptySubtitle}>{t('groupsScreen.noStudents')}</Text>
                                    )}

                                    <TouchableOpacity
                                        style={styles.downloadButton}
                                        onPress={() => handleDownloadCsv(selectedGroup)}
                                    >
                                        <Ionicons name="download-outline" size={18} color="#fff" />
                                        <Text style={styles.downloadButtonText}>{t('groupsScreen.downloadCsv')}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll:  { padding: 20, paddingBottom: 40 },

    banner: {
        backgroundColor: '#fff3cd',
        borderLeftWidth: 4,
        borderLeftColor: '#ffc107',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    bannerText: { color: '#856404', fontSize: 13 },

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
    cardEnrolled: { borderLeftColor: '#16a34a' },

    topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    groupName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    badge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    subject:   { fontSize: 13, color: '#1a73e8', fontWeight: '600', marginBottom: 12 },
    divider:   { height: 1, backgroundColor: '#f0f0f0', marginBottom: 12 },
    metaRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
    metaText:  { fontSize: 12, color: '#6b7280' },
    fullText:  { color: '#dc2626' },

    enrolledBadge:  { alignSelf: 'flex-start', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8 },
    pendingBadge:   { backgroundColor: '#fef9c3' },
    rejectedBadge:  { backgroundColor: '#fee2e2' },
    enrolledBadgeText: { fontSize: 11, fontWeight: '700', color: '#166534' },

    actionRow: { marginTop: 12 },
    actionBtn: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    joinBtn:     { backgroundColor: '#1a73e8' },
    leaveBtn:    { backgroundColor: '#dc2626' },
    cancelBtn:   { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
    rejectedBtn: { backgroundColor: '#f3f4f6' },
    disabledBtn: { opacity: 0.45 },
    actionBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
    cancelBtnText:   { color: '#dc2626', fontWeight: '700', fontSize: 14 },
    rejectedBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },

    emptyState:    { alignItems: 'center', paddingTop: 80 },
    emptyTitle:    { fontSize: 18, fontWeight: 'bold', color: '#4b5563', marginTop: 10 },
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
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    modalLabel: { fontSize: 12, color: '#6b7280', marginTop: 12 },
    modalValue: { fontSize: 15, color: '#111827', fontWeight: '600' },

    studentsList: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12 },
    studentRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    studentName:  { fontSize: 14, color: '#111827' },
    studentId:    { fontSize: 12, color: '#6b7280' },

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
    downloadButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },
});
