import React, { useEffect, useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import CustomHeader from '../common/CustomHeader';
import ScreenContainer from '../common/ScreenContainer';

/* ── Types ── */
interface SubjectData {
    _id: string;
    code: string;
    name: string;
    creditHours: number;
    prerequisites: { _id: string; code: string; name: string }[];
    corequisites: { _id: string; code: string; name: string }[];
}

interface GroupData {
    _id: string;
    number: number;
    subject: string;
    type: string;
    from: number;
    to: number;
    day: string;
    capacity: number;
    place?: string;
    students: { _id: string }[] | string[];
    requestStatus?: 'enrolled' | 'pending' | 'approved' | 'rejected';
    requestId?: string;
}

interface StudentMe {
    _id: string;
    role: string;
    name: string;
    gpa: number;
    completedSubjects: string[];
}

interface EnrollmentRequestData {
    _id: string;
    student: string;
    group: string | GroupData;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const getGroupId = (group: string | GroupData | { _id: string }): string =>
    typeof group === 'object' && group !== null ? (group as any)._id?.toString() : String(group);

const MAX_HOURS = 18;
const DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

const formatSubjectCode = (code: string) => {
    const m = code.match(/([a-zA-Z]+)(\d+)/);
    if (m) return `${m[1].toUpperCase()} ${m[2]}`;
    return code.toUpperCase();
};

const formatTime = (hour: number, t: (k: string) => string) => {
    const period = hour >= 12 ? t("groupsSchedule.pm") : t("groupsSchedule.am");
    const display = hour > 12 ? hour - 12 : hour;
    return `${display}:00 ${period}`;
};

const getStudentObjectId = (students: ({ _id: string } | string)[]): string[] =>
    students.map(s => (typeof s === "object" && s !== null ? s._id?.toString() : String(s)));

const TIMETABLE_COLORS = [
    { bg: "#e3f2fd", border: "#42a5f5", text: "#1565c0" },
    { bg: "#fce4ec", border: "#ef5350", text: "#c62828" },
    { bg: "#e8f5e9", border: "#66bb6a", text: "#2e7d32" },
    { bg: "#fff3e0", border: "#ffa726", text: "#e65100" },
    { bg: "#f3e5f5", border: "#ab47bc", text: "#6a1b9a" },
    { bg: "#e0f7fa", border: "#26c6da", text: "#00695c" },
];

export default function RegisterSubjects() {
    const { token } = useAuth();
    const { t, locale: language } = useLanguage();

    const [student, setStudent] = useState<StudentMe | null>(null);
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [myRequests, setMyRequests] = useState<EnrollmentRequestData[]>([]);
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const apiFetch = async (endpoint: string, options: any = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };
        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('common.error'));
        return data;
    };

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!token) throw new Error(t('login.loginFailed'));

            const [meData, subData, grpData, reqData, settingsData] = await Promise.all([
                apiFetch('/auth/me'),
                apiFetch('/subjects'),
                apiFetch('/groups'),
                apiFetch('/groups/my-requests').catch(() => []), // fallback if fails somehow
                apiFetch('/settings').catch(() => ({ registrationOpen: true })),
            ]);

            setStudent(meData);
            setSubjects(subData || []);
            setGroups(grpData || []);
            setMyRequests(reqData || []);
            setRegistrationOpen(settingsData?.registrationOpen ?? true);
        } catch (err: any) {
            setError(err.message || t("common.error"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const completedIds = useMemo(() => new Set(student?.completedSubjects ?? []), [student]);

    const myGroups = useMemo(() => {
        if (!student) return [];
        return groups.filter(g => getStudentObjectId(g.students).includes(student._id));
    }, [groups, student]);

    const myGroupsWithStatus = useMemo(() => {
        const result: GroupData[] = [];
        myGroups.forEach(g => result.push({ ...g, requestStatus: 'enrolled' }));
        myRequests.forEach(req => {
            const reqGroupId = getGroupId(req.group);
            const grp = groups.find(g => g._id === reqGroupId);
            if (grp && !myGroups.some(g => g._id === grp._id)) {
                result.push({ ...grp, requestStatus: req.status, requestId: req._id });
            }
        });
        return result;
    }, [myGroups, myRequests, groups]);

    const enrolledSubjectCodes = useMemo(() => new Set(myGroups.map(g => g.subject.toLowerCase())), [myGroups]);

    const requestedSubjectCodes = useMemo(() => {
        const codes = new Set<string>();
        myRequests.forEach(req => {
            if (req.status === 'pending' || req.status === 'approved') {
                const grp = groups.find(g => g._id === getGroupId(req.group));
                if (grp) codes.add(grp.subject.toLowerCase());
            }
        });
        return codes;
    }, [myRequests, groups]);

    const allSelectedSubjectCodes = useMemo(() => {
        const combined = new Set(enrolledSubjectCodes);
        requestedSubjectCodes.forEach(code => combined.add(code));
        return combined;
    }, [enrolledSubjectCodes, requestedSubjectCodes]);

    const subjectById = useMemo(() => {
        const m = new Map<string, SubjectData>();
        subjects.forEach(s => m.set(s._id, s));
        return m;
    }, [subjects]);

    const subjectByCode = useMemo(() => {
        const m = new Map<string, SubjectData>();
        subjects.forEach(s => m.set(s.code.toLowerCase(), s));
        return m;
    }, [subjects]);

    const enrolledHours = useMemo(() => {
        let total = 0;
        allSelectedSubjectCodes.forEach(code => {
            const sub = subjectByCode.get(code);
            if (sub) total += sub.creditHours;
        });
        return total;
    }, [allSelectedSubjectCodes, subjectByCode]);

    const availableSubjects = useMemo(() => {
        return subjects.filter(s => {
            if (completedIds.has(s._id)) return false;
            if (allSelectedSubjectCodes.has(s.code.toLowerCase())) return false;
            const prereqsMet = s.prerequisites.every(pre => completedIds.has(pre._id));
            if (!prereqsMet) return false;
            return true;
        });
    }, [subjects, completedIds, allSelectedSubjectCodes]);

    const groupsForSelected = useMemo(() => {
        if (!selectedSubject) return [];
        const sub = subjectById.get(selectedSubject);
        if (!sub) return [];
        const subjectGroups = groups.filter(g => g.subject.toLowerCase() === sub.code.toLowerCase());

        const byNum = new Map<number, GroupData[]>();
        subjectGroups.forEach(g => {
            const arr = byNum.get(g.number) || [];
            arr.push(g);
            byNum.set(g.number, arr);
        });

        const available: GroupData[] = [];
        byNum.forEach(pair => {
            const anyFull = pair.some(g => g.students.length >= g.capacity);
            if (!anyFull) available.push(...pair);
        });
        return available;
    }, [selectedSubject, groups, subjectById]);

    const subjectColorMap = useMemo(() => {
        const m = new Map<string, typeof TIMETABLE_COLORS[0]>();
        let i = 0;
        myGroupsWithStatus.forEach(g => {
            const key = g.subject.toLowerCase();
            if (!m.has(key)) {
                m.set(key, TIMETABLE_COLORS[i % TIMETABLE_COLORS.length]);
                i++;
            }
        });
        return m;
    }, [myGroupsWithStatus]);

    // Check if a student can request this pair
    const canRequestPair = (firstGroupId: string) => {
        const firstGroup = groups.find(g => g._id === firstGroupId);
        if (!firstGroup) return false;
        const sub = subjectByCode.get(firstGroup.subject.toLowerCase());
        if (!sub) return false;

        if (sub.corequisites && sub.corequisites.length > 0) {
            const unmet = sub.corequisites.filter(co => {
                if (completedIds.has(co._id)) return false;
                if (enrolledSubjectCodes.has(co.code?.toLowerCase() || '')) return false;
                return true;
            });
            if (unmet.length > 0) {
                const names = unmet.map(c => formatSubjectCode(c.code || c.name)).join(", ");
                Alert.alert(t('common.error'), t("register.errors.corequisitesRequired", { subjects: names }));
                return false;
            }
        }

        if (enrolledHours + sub.creditHours > MAX_HOURS) {
            Alert.alert(t('common.error'), t("register.errors.maxHoursExceeded"));
            return false;
        }
        return true;
    }

    const handleRequestPair = async (groupIds: string[]) => {
        if (!canRequestPair(groupIds[0])) return;
        setActionLoading(groupIds[0]);
        try {
            for (const gId of groupIds) {
                await apiFetch(`/groups/${gId}/request`, { method: 'POST' });
            }
            Alert.alert('', t('register.success'));
            await fetchAll();
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t("register.failed"));
            await fetchAll();
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelRequest = async (requestIds: string[]) => {
        setActionLoading(requestIds[0]);
        try {
            for (const rId of requestIds) {
                await apiFetch(`/groups/requests/${rId}`, { method: 'DELETE' });
            }
            Alert.alert('', t('register.cancelSuccess'));
            await fetchAll();
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t("register.failed"));
            await fetchAll();
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemovePair = async (groupIds: string[]) => {
        setActionLoading(groupIds[0]);
        try {
            for (const gId of groupIds) {
                await apiFetch(`/groups/${gId}/students/me`, { method: 'DELETE' });
            }
            Alert.alert('', t('register.removeSuccess'));
            await fetchAll();
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t("register.failed"));
            await fetchAll();
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <ScreenContainer>
                <CustomHeader title={t('register.title')} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={{ marginTop: 12, color: '#6b7280' }}>{t('register.loading')}</Text>
                </View>
            </ScreenContainer>
        );
    }

    if (error) {
        return (
            <ScreenContainer>
                <CustomHeader title={t('register.title')} />
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchAll}>
                        <Text style={styles.retryBtnText}>{t('common.error')}</Text>
                    </TouchableOpacity>
                </View>
            </ScreenContainer>
        );
    }

    const isRtl = language === 'ar';
    const textDir = isRtl ? 'right' : 'left';

    // Grouping by pairs for UI
    const byNumberGroupsForSelected = new Map<number, GroupData[]>();
    groupsForSelected.forEach(g => {
        const arr = byNumberGroupsForSelected.get(g.number) || [];
        arr.push(g);
        byNumberGroupsForSelected.set(g.number, arr);
    });


    return (
        <ScreenContainer>
            <CustomHeader title={t('register.title')} />
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <View style={styles.creditCounter}>
                    <Text style={styles.creditLabel}>{t('register.selectedCredits')}</Text>
                    <Text style={styles.creditValue}>{enrolledHours} / {MAX_HOURS}</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min((enrolledHours / MAX_HOURS) * 100, 100)}%` }]} />
                    </View>
                </View>

            {!registrationOpen && (
                <View style={styles.alertBox}>
                    <Text style={styles.alertTitle}>⚠️ {t('register.closed')}</Text>
                    <Text style={styles.alertText}>{t('register.closedMessage')}</Text>
                </View>
            )}

            {/* Registered / Timetable substitute (List grouped by day) */}
            <Text style={[styles.sectionTitle, { textAlign: textDir }]}>📋 {t('register.registeredTitle')}</Text>
            {myGroupsWithStatus.length === 0 ? (
                <Text style={[styles.emptyText, { textAlign: textDir }]}>{t('register.noRegistered')}</Text>
            ) : (
                <View style={styles.scheduleList}>
                    {DAYS.map(day => {
                        const dayGroups = myGroupsWithStatus.filter(g => g.day.toLowerCase() === day);
                        if (dayGroups.length === 0) return null;
                        dayGroups.sort((a,b) => a.from - b.from);
                        return (
                            <View key={day} style={styles.dayGroup}>
                                <Text style={[styles.dayTitle, { textAlign: textDir }]}>
                                    {t(`schedule.days.${day}`)}
                                </Text>
                                {dayGroups.map(g => {
                                    const color = subjectColorMap.get(g.subject.toLowerCase()) || TIMETABLE_COLORS[0];
                                    const sub = subjectByCode.get(g.subject.toLowerCase());




                                    const status = g.requestStatus || 'pending';
                                    const badgeStyle = styles[`status_${status}` as keyof typeof styles] || {};
                                    const badgeTextStyle = styles[`statusText_${status}` as keyof typeof styles] || {};
                                    const isEnrolled = g.requestStatus === 'enrolled';
                                    const isPending = g.requestStatus === 'pending';
                                    const isRejected = g.requestStatus === 'rejected';

                                    return (
                                        <View key={`${g._id}-${g.requestStatus}`} style={[styles.eventCard, {
                                            backgroundColor: isRejected ? '#f5f5f5' : color.bg,
                                            borderLeftColor: isRejected ? '#999' : isPending ? '#ffa726' : color.border,
                                            opacity: isRejected ? 0.6 : 1
                                        }]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.eventCode, { color: isRejected ? '#666' : color.text }]}>
                                                    {formatSubjectCode(g.subject)} <Text style={{fontSize: 12, fontWeight: '400'}}>({t('groupsSchedule.groupNumber', {number: g.number})})</Text>
                                                </Text>
                                                {sub && <Text style={styles.eventName}>{sub.name}</Text>}
                                                <Text style={styles.eventTime}>{formatTime(g.from, t)} - {formatTime(g.to, t)}</Text>
                                                <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', gap: 6, marginTop: 4 }}>
                                                    <View style={styles.typeBadge}>
                                                        <Text style={styles.typeBadgeText}>{t(`groupsSchedule.typeValues.${g.type.toLowerCase()}`, { defaultValue: g.type })}</Text>
                                                    </View>
                                                    <View style={[styles.statusBadge, badgeStyle]}>
                                                        <Text style={[styles.statusBadgeText, badgeTextStyle]}>
                                                            {t(`register.status.${status === 'enrolled' ? 'enrolled' : status}`)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <View style={{ justifyContent: 'center' }}>
                                                {isEnrolled && (
                                                    <TouchableOpacity style={styles.actionBtn} disabled={!!actionLoading} onPress={() => {
                                                        const pairGroups = myGroups.filter(mg => mg.subject.toLowerCase() === g.subject.toLowerCase() && mg.number === g.number);
                                                        handleRemovePair(pairGroups.map(pg => pg._id));
                                                    }}>
                                                        <Text style={styles.actionBtnText}>✕</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {isPending && g.requestId && (
                                                    <TouchableOpacity style={styles.actionBtn} disabled={!!actionLoading} onPress={() => {
                                                        const pairRequestIds = myGroupsWithStatus
                                                            .filter(mg => mg.subject.toLowerCase() === g.subject.toLowerCase() && mg.number === g.number && mg.requestStatus === 'pending' && mg.requestId)
                                                            .map(mg => mg.requestId!);
                                                        handleCancelRequest(pairRequestIds);
                                                    }}>
                                                        <Text style={styles.actionBtnText}>✕</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Subject Selection Sidebar Equivalent */}
            <Text style={[styles.sectionTitle, { textAlign: textDir, marginTop: 24 }]}>📚 {t('register.availableTitle')}</Text>

            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedSubject}
                    onValueChange={(itemValue) => setSelectedSubject(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label={t('register.selectPlaceholder')} value="" />
                    {availableSubjects.map(s => (
                        <Picker.Item key={s._id} label={`${formatSubjectCode(s.code)} - ${s.name} (${s.creditHours} ${t('register.hrs')})`} value={s._id} />
                    ))}
                </Picker>
            </View>

            {selectedSubject && (
                (() => {
                    const sub = subjectById.get(selectedSubject);
                    if (sub && sub.corequisites && sub.corequisites.length > 0) {
                        return (
                            <View style={styles.coreqNotice}>
                                <Text style={styles.coreqText}>⚠️ {t('register.corequisiteNotice')}: {sub.corequisites.map(c => formatSubjectCode(c.code || c.name)).join(", ")}</Text>
                            </View>
                        );
                    }
                    return null;
                })()
            )}

            {selectedSubject && groupsForSelected.length === 0 && (
                <Text style={styles.emptyText}>{t('register.noGroupsForSubject')}</Text>
            )}

            {groupsForSelected.length > 0 && Array.from(byNumberGroupsForSelected.entries()).map(([num, pair]) => {
                const lecture = pair.find(g => g.type.toLowerCase() === "lecture");
                const coreq = pair.find(g => g.type.toLowerCase() !== "lecture");
                const allIds = pair.map(g => g._id);

                const pendingRequestIds = allIds
                    .map(gId => myRequests.find(r => getGroupId(r.group) === gId && r.status === 'pending')?._id)
                    .filter(Boolean) as string[];
                const hasPendingRequest = pendingRequestIds.length > 0;
                const isPairLoading = actionLoading === allIds[0] || actionLoading === pendingRequestIds[0];

                return (
                    <View key={num} style={styles.groupCard}>
                        <View style={styles.groupCardHeader}>
                            <Text style={styles.groupNumber}>{t('groupsSchedule.groupNumber', { number: num })}</Text>
                        </View>
                        <View style={styles.groupCardBody}>
                            {lecture && (
                                <View style={styles.groupSlot}>
                                    <View style={styles.badge}><Text style={styles.badgeText}>{t('groupsSchedule.typeValues.lecture')}</Text></View>
                                    <Text style={styles.slotText}>📅 {t(`schedule.days.${lecture.day}`)}</Text>
                                    <Text style={styles.slotText}>🕐 {formatTime(lecture.from, t)} - {formatTime(lecture.to, t)}</Text>
                                </View>
                            )}
                            {coreq && (
                                <View style={styles.groupSlot}>
                                    <View style={styles.badge}><Text style={styles.badgeText}>{t(`groupsSchedule.typeValues.${coreq.type.toLowerCase()}`)}</Text></View>
                                    <Text style={styles.slotText}>📅 {t(`schedule.days.${coreq.day}`)}</Text>
                                    <Text style={styles.slotText}>🕐 {formatTime(coreq.from, t)} - {formatTime(coreq.to, t)}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.groupCardFooter}>
                            {hasPendingRequest ? (
                                <TouchableOpacity style={[styles.btn, styles.btnCancel]} disabled={!!actionLoading} onPress={() => handleCancelRequest(pendingRequestIds)}>
                                    {isPairLoading ? <ActivityIndicator size="small" color="#c53030" /> : <Text style={styles.btnCancelText}>{t('register.cancelRequestBtn')}</Text>}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={[styles.btn, styles.btnRegister]} disabled={!!actionLoading || !registrationOpen} onPress={() => handleRequestPair(allIds)}>
                                    {isPairLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnRegisterText}>{t('register.requestBtn')}</Text>}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                );
            })}
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { color: '#e53e3e', fontSize: 16, textAlign: 'center', marginBottom: 12 },
    retryBtn: { padding: 12, backgroundColor: '#1a73e8', borderRadius: 8 },
    retryBtnText: { color: '#fff', fontWeight: 'bold' },

    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },

    header: { marginBottom: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#6b7280' },

    creditCounter: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
    creditLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
    creditValue: { fontSize: 18, fontWeight: 'bold', color: '#1a73e8', marginBottom: 8 },
    progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#1a73e8' },

    alertBox: { backgroundColor: '#fff3cd', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ffc107', marginBottom: 16 },
    alertTitle: { fontWeight: 'bold', color: '#856404', marginBottom: 4 },
    alertText: { color: '#856404', fontSize: 13 },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
    emptyText: { color: '#6b7280', fontStyle: 'italic', marginBottom: 16 },

    scheduleList: { marginBottom: 24 },
    dayGroup: { marginBottom: 16 },
    dayTitle: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 4 },
    eventCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center' },
    eventCode: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    eventName: { fontSize: 13, color: '#4b5563', marginBottom: 4 },
    eventTime: { fontSize: 13, color: '#6b7280' },

    typeBadge: { backgroundColor: '#e5e7eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    typeBadgeText: { fontSize: 11, color: '#374151', fontWeight: '500' },

    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
    status_enrolled: { backgroundColor: '#dcfce7' },
    statusText_enrolled: { color: '#166534' },
    status_pending: { backgroundColor: '#fef9c3' },
    statusText_pending: { color: '#854d0e' },
    status_approved: { backgroundColor: '#dcfce7' },
    statusText_approved: { color: '#166534' },
    status_rejected: { backgroundColor: '#fee2e2' },
    statusText_rejected: { color: '#991b1b' },

    actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
    actionBtnText: { color: '#dc2626', fontSize: 14, fontWeight: 'bold' },

    pickerContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 12, overflow: 'hidden' },
    picker: { height: 50, width: '100%' },

    coreqNotice: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 12 },
    coreqText: { color: '#1e40af', fontSize: 13 },

    groupCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12, overflow: 'hidden' },
    groupCardHeader: { backgroundColor: '#f3f4f6', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    groupNumber: { fontWeight: 'bold', color: '#374151' },
    groupCardBody: { padding: 16 },
    groupSlot: { marginBottom: 12 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#e5e7eb', marginBottom: 6 },
    badgeText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
    slotText: { fontSize: 14, color: '#374151', marginBottom: 4 },
    groupCardFooter: { padding: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fafafa', alignItems: 'stretch' },

    btn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    btnRegister: { backgroundColor: '#1a73e8' },
    btnRegisterText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    btnCancel: { backgroundColor: '#fee2e2' },
    btnCancelText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },
});
