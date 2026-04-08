import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiGet, apiPost, apiDelete, getEligibleSubjects } from "../../services/api";
import "./RegisterSubjects.css";

/* ── Types ── */
interface SubjectData {
    _id: string;
    code: string;
    name: string;
    level: '1' | '2' | '3' | '4';
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
}

interface StudentMe {
    id: number;
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

// Helper to extract group ID from a request (group can be a string ID or a populated object)
const getGroupId = (group: string | GroupData | { _id: string }): string =>
    typeof group === 'object' && group !== null ? (group as any)._id?.toString() : String(group);

const MAX_HOURS = 18;

/* ── Helpers ── */
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

const formatHour = (h: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display} ${suffix}`;
};

const getTypeClass = (type: string) => {
    switch (type.toLowerCase()) {
        case "lecture":  return "regBadge regBadgeLecture";
        case "lab":      return "regBadge regBadgeLab";
        case "tutorial": return "regBadge regBadgeTutorial";
        default:         return "regBadge regBadgeDefault";
    }
};

const getStudentObjectId = (students: ({ _id: string } | string)[]): string[] =>
    students.map(s => (typeof s === "object" && s !== null ? s._id?.toString() : String(s)));

const DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];
const HOURS_RANGE = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const TIMETABLE_COLORS = [
    { bg: "#e3f2fd", border: "#42a5f5", text: "#1565c0" },
    { bg: "#fce4ec", border: "#ef5350", text: "#c62828" },
    { bg: "#e8f5e9", border: "#66bb6a", text: "#2e7d32" },
    { bg: "#fff3e0", border: "#ffa726", text: "#e65100" },
    { bg: "#f3e5f5", border: "#ab47bc", text: "#6a1b9a" },
    { bg: "#e0f7fa", border: "#26c6da", text: "#00695c" },
    { bg: "#fff9c4", border: "#ffee58", text: "#f57f17" },
    { bg: "#fbe9e7", border: "#ff7043", text: "#bf360c" },
];

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */
const RegisterSubjects = () => {
    const { t, i18n } = useTranslation();

    /* ── State ── */
    const [student, setStudent]         = useState(null as StudentMe | null);
    const [subjects, setSubjects]       = useState([] as SubjectData[]);
    const [eligibleSubjects, setEligibleSubjects] = useState([] as SubjectData[]);
    const [groups, setGroups]           = useState([] as GroupData[]);
    const [myRequests, setMyRequests]   = useState([] as EnrollmentRequestData[]);
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null as string | null);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [actionLoading, setActionLoading]     = useState(null as string | null);
    const [actionMsg, setActionMsg]     = useState(null as { type: "success" | "error"; text: string } | null);

    /* ── Fetch all data ── */
    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = sessionStorage.getItem("token");
            if (!token) {
                setError("No token");
                return;
            }

            const [meRes, subRes, eligibleRes, grpRes, reqRes, settingsRes] = await Promise.all([
                fetch("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                apiGet("/subjects"),
                getEligibleSubjects(),
                apiGet("/groups"),
                apiGet("/groups/my-requests"),
                apiGet("/settings"),
            ]);

            if (!meRes.ok) {
                setError("Failed to fetch student data");
                return;
            }
            const meData: StudentMe = await meRes.json();
            setStudent(meData);

            if (!subRes.res.ok) {
                setError("Failed to fetch subjects");
                return;
            }
            setSubjects(subRes.data as SubjectData[]);

            setEligibleSubjects(eligibleRes as SubjectData[]);

            if (!grpRes.res.ok) {
                setError("Failed to fetch groups");
                return;
            }
            setGroups(grpRes.data as GroupData[]);

            if (reqRes.res.ok) {
                setMyRequests(reqRes.data as EnrollmentRequestData[]);
            }

            if (settingsRes.res.ok) {
                setRegistrationOpen((settingsRes.data as any).registrationOpen ?? true);
            }
        } catch (err: any) {
            setError(err.message || t("registration.errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    /* ── Derived data ── */
    const completedIds = useMemo(
        () => new Set(student?.completedSubjects ?? []),
        [student]
    );

    // Groups the student is enrolled in (approved and added to group)
    const myGroups = useMemo(() => {
        if (!student) return [];
        const sid = student._id;
        return groups.filter((g: GroupData) => getStudentObjectId(g.students).includes(sid));
    }, [groups, student]);

    // Groups with request status (combines enrolled + requested groups)
    const myGroupsWithStatus = useMemo(() => {
        const result: (GroupData & { requestStatus: 'enrolled' | 'pending' | 'approved' | 'rejected', requestId?: string })[] = [];
        
        // Add enrolled groups
        myGroups.forEach((g: GroupData) => {
            result.push({ ...g, requestStatus: 'enrolled' });
        });
        
        // Add requested groups (that aren't already enrolled)
        myRequests.forEach((req: EnrollmentRequestData) => {
            const reqGroupId = getGroupId(req.group);
            // Use populated group data if available, otherwise look up in groups array
            const grp = typeof req.group === 'object' && req.group !== null
                ? req.group as GroupData
                : groups.find((g: GroupData) => g._id === reqGroupId);
            if (grp && !myGroups.some((g: GroupData) => g._id === (grp as GroupData)._id)) {
                result.push({ ...(grp as GroupData), requestStatus: req.status, requestId: req._id });
            }
        });
        
        return result;
    }, [myGroups, myRequests, groups]);

    const enrolledSubjectCodes = useMemo(
        () => new Set(myGroups.map((g: GroupData) => g.subject.toLowerCase())),
        [myGroups]
    );

    // Subjects that have pending or approved requests (not yet enrolled in group)
    const requestedSubjectCodes = useMemo(() => {
        const codes = new Set<string>();
        myRequests.forEach((req: EnrollmentRequestData) => {
            if (req.status === 'pending' || req.status === 'approved') {
                const reqGroupId = getGroupId(req.group);
                // Use populated group data if available
                const grp = typeof req.group === 'object' && req.group !== null
                    ? req.group as GroupData
                    : groups.find((g: GroupData) => g._id === reqGroupId);
                if (grp) codes.add((grp as GroupData).subject.toLowerCase());
            }
        });
        return codes;
    }, [myRequests, groups]);

    // All subjects that are either enrolled or have active requests
    const allSelectedSubjectCodes = useMemo(() => {
        const combined = new Set(enrolledSubjectCodes);
        requestedSubjectCodes.forEach(code => combined.add(code));
        return combined;
    }, [enrolledSubjectCodes, requestedSubjectCodes]);

    const subjectById = useMemo(() => {
        const m = new Map<string, SubjectData>();
        subjects.forEach((s: SubjectData) => m.set(s._id, s));
        return m;
    }, [subjects]);

    const subjectByCode = useMemo(() => {
        const m = new Map<string, SubjectData>();
        subjects.forEach((s: SubjectData) => m.set(s.code.toLowerCase(), s));
        return m;
    }, [subjects]);

    // Total credit hours including both enrolled AND pending/approved requests
    const enrolledHours = useMemo(() => {
        let total = 0;
        allSelectedSubjectCodes.forEach((code: string) => {
            const sub = subjectByCode.get(code);
            if (sub) total += sub.creditHours;
        });
        return total;
    }, [allSelectedSubjectCodes, subjectByCode]);

    // Calculate completed credit hours from completed subjects
    const completedHours = useMemo(() => {
        let total = 0;
        student?.completedSubjects?.forEach((completedId: string) => {
            const sub = subjectById.get(completedId);
            if (sub) total += sub.creditHours;
        });
        return total;
    }, [student, subjectById]);

    // Calculate student level from completed hours
    const studentLevel = useMemo(() => {
        if (!student || completedHours === 0) return '1';
        if (completedHours <= 30) return '1';
        if (completedHours <= 60) return '2';
        if (completedHours <= 90) return '3';
        return '4';
    }, [student, completedHours]);

    const availableSubjects = useMemo(() => {
        return eligibleSubjects.filter((s: SubjectData) => {
            if (completedIds.has(s._id)) return false;
            // Exclude subjects that are enrolled OR have pending/approved requests
            if (allSelectedSubjectCodes.has(s.code.toLowerCase())) return false;
            return true;
        });
    }, [eligibleSubjects, completedIds, allSelectedSubjectCodes]);

    const groupsForSelected = useMemo(() => {
        if (!selectedSubject) return [];
        const sub = subjectById.get(selectedSubject);
        if (!sub) return [];
        const subjectGroups = groups.filter((g: GroupData) => g.subject.toLowerCase() === sub.code.toLowerCase());

        // Group by number to check pair capacity
        const byNum = new Map<number, GroupData[]>();
        subjectGroups.forEach((g: GroupData) => {
            const arr = byNum.get(g.number) || [];
            arr.push(g);
            byNum.set(g.number, arr);
        });

        // Filter out pairs where ANY group in the pair is full
        const availableGroups: GroupData[] = [];
        byNum.forEach((pair) => {
            const anyFull = pair.some((g: GroupData) => g.students.length >= g.capacity);
            if (!anyFull) {
                availableGroups.push(...pair);
            }
        });

        return availableGroups;
    }, [selectedSubject, groups, subjectById]);

    const subjectForGroup = (g: GroupData): SubjectData | undefined =>
        subjectByCode.get(g.subject.toLowerCase());

    // Color map for subjects in timetable (includes requested groups)
    const subjectColorMap = useMemo(() => {
        const m = new Map<string, typeof TIMETABLE_COLORS[0]>();
        let i = 0;
        myGroupsWithStatus.forEach((g) => {
            const key = g.subject.toLowerCase();
            if (!m.has(key)) {
                m.set(key, TIMETABLE_COLORS[i % TIMETABLE_COLORS.length]);
                i++;
            }
        });
        return m;
    }, [myGroupsWithStatus]);

    /* ── Actions ── */

    // Request to join a single group (no fetchAll, used as building block)
    const requestSingle = async (groupId: string): Promise<boolean> => {
        const { res, data } = await apiPost(`/groups/${groupId}/request`, {});
        if (!res.ok) throw new Error((data as any).error || "Failed");
        return true;
    };

    // Remove from a single group (no fetchAll, used as building block)
    const removeSingle = async (groupId: string): Promise<boolean> => {
        const { res, data } = await apiDelete(`/groups/${groupId}/students/me`);
        if (!res.ok) throw new Error((data as any).error || "Failed");
        return true;
    };

    // Cancel a pending request
    const cancelRequest = async (requestId: string): Promise<boolean> => {
        const { res, data } = await apiDelete(`/groups/requests/${requestId}`);
        if (!res.ok) throw new Error((data as any).error || "Failed");
        return true;
    };

    // Request to join all groups of a pair
    const handleRequestPair = async (groupIds: string[]) => {
        // Validate using the first group's subject
        const firstGroup = groups.find((g: GroupData) => g._id === groupIds[0]);
        if (!firstGroup) return;

        const sub = subjectForGroup(firstGroup);
        if (sub && sub.corequisites && sub.corequisites.length > 0) {
            const unmet = sub.corequisites.filter((co: { _id: string; code: string }) => {
                if (completedIds.has(co._id)) return false;
                if (enrolledSubjectCodes.has(co.code?.toLowerCase())) return false;
                return true;
            });

            if (unmet.length > 0) {
                const names = unmet.map((c: { code: string; name: string }) => formatSubjectCode(c.code || c.name)).join(", ");
                setActionMsg({
                    type: "error",
                    text: t("registration.errors.corequisitesRequired", { subjects: names }),
                });
                return;
            }
        }

        if (sub) {
            if (enrolledHours + sub.creditHours > MAX_HOURS) {
                setActionMsg({ type: "error", text: t("registration.errors.maxHoursExceeded") });
                return;
            }
        }

        setActionLoading(groupIds[0]);
        setActionMsg(null);
        try {
            // Request to join ALL groups before refreshing
            for (const gId of groupIds) {
                await requestSingle(gId);
            }
            setActionMsg({ type: "success", text: t("registration.requestSuccess") });
            await fetchAll();
        } catch (err: any) {
            const msg = err.message && err.message.startsWith("registration.errors.") 
                ? t(err.message) 
                : err.message || t("registration.errors.requestFailed");
            setActionMsg({ type: "error", text: msg });
            await fetchAll(); // refresh to show partial state
        } finally {
            setActionLoading(null);
        }
    };

    // Cancel request for a pair
    const handleCancelRequest = async (requestIds: string[]) => {
        setActionLoading(requestIds[0]);
        setActionMsg(null);
        try {
            for (const rId of requestIds) {
                await cancelRequest(rId);
            }
            setActionMsg({ type: "success", text: t("registration.cancelSuccess") });
            await fetchAll();
        } catch (err: any) {
            setActionMsg({ type: "error", text: err.message || t("registration.errors.cancelFailed") });
            await fetchAll();
        } finally {
            setActionLoading(null);
        }
    };

    // Remove from all groups of a pair
    const handleRemovePair = async (groupIds: string[]) => {
        setActionLoading(groupIds[0]);
        setActionMsg(null);
        try {
            // Remove from ALL groups before refreshing
            for (const gId of groupIds) {
                await removeSingle(gId);
            }
            setActionMsg({ type: "success", text: t("registration.removeSuccess") });
            await fetchAll();
        } catch (err: any) {
            setActionMsg({ type: "error", text: err.message || t("registration.errors.removeFailed") });
            await fetchAll();
        } finally {
            setActionLoading(null);
        }
    };

    const getDayDisplay = (day: string) => t(`days.${day}`);

    /* ── Render ── */
    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">{t("registration.loading")}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <h2>{t("registration.title")}</h2>
                <div className="error">
                    <strong>{t("groupsSchedule.errorPrefix")}</strong> {error}
                    <button onClick={fetchAll} className="btn-primary" style={{ marginInlineStart: 12 }}>
                        {t("groupsSchedule.tryAgain")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container regContainer">
            {/* ── Header ── */}
            <div className="regHeader">
                <div>
                    <h2>{t("registration.title")}</h2>
                    <p className="regSubtitle">{t("registration.subtitle")}</p>
                </div>
                <div className="regHeaderStats">
                    {student && (
                        <div className="regLevelBadge">
                            <span className="regLevelLabel">{t("registration.studentLevel")}</span>
                            <span className={`regLevelValue regLevel${studentLevel}`}>
                                {t(`registration.level${studentLevel}`)}
                            </span>
                        </div>
                    )}
                    <div className="regCreditCounter">
                        <span className="regCreditLabel">{t("registration.selectedCredits")}</span>
                        <span className="regCreditValue">
                            <strong>{enrolledHours}</strong> / {MAX_HOURS}
                        </span>
                        <div className="regCreditBar">
                            <div
                                className="regCreditBarFill"
                                style={{ width: `${Math.min((enrolledHours / MAX_HOURS) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Registration status alert ── */}
            {!registrationOpen && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '12px 16px',
                    backgroundColor: '#fff3cd',
                    borderLeft: '4px solid #ffc107',
                    borderRadius: '4px',
                    color: '#856404'
                }}>
                    <strong>⚠️ {t("registration.errors.registrationClosed")}</strong>
                    <p style={{ margin: '8px 0 0 0' }}>{t("registration.closedMessage") || "Registration is currently closed. You cannot request new groups at this time."}</p>
                </div>
            )}

            {/* ── Action messages ── */}
            {actionMsg && (
                <div className={actionMsg.type === "success" ? "success" : "error"}>
                    {actionMsg.text}
                </div>
            )}

            {/* ── Two-column layout ── */}
            <div className="regLayout">
                {/* ════════════════════════════════════
                    LEFT: Weekly Timetable
                   ════════════════════════════════════ */}
                <div className="regTimetableSection">
                    <h3 className="regSectionTitle">📋 {t("registration.registeredTitle")}</h3>
                    <div className="regTimetableWrapper" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                        <table className="regTimetable" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                            <thead>
                                <tr>
                                    <th className="regTimetableCorner">{t("registration.colTime")}</th>
                                    {DAYS.map(day => (
                                        <th key={day} className="regTimetableDayHeader">{getDayDisplay(day)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {HOURS_RANGE.map(hour => (
                                    <tr key={hour}>
                                        <td className="regTimetableHourCell">{formatHour(hour)}</td>
                                        {DAYS.map(day => {
                                            // Find groups in this cell (includes requested groups)
                                            const cellGroups = myGroupsWithStatus.filter(
                                                (g) => g.day.toLowerCase() === day && g.from === hour
                                            );
                                            if (cellGroups.length === 0) {
                                                // Check if this cell is spanned by a group starting earlier
                                                const spanned = myGroupsWithStatus.some(
                                                    (g) => g.day.toLowerCase() === day && g.from < hour && g.to > hour
                                                );
                                                if (spanned) return null; // cell is part of a rowspan
                                                return <td key={day} className="regTimetableCell"></td>;
                                            }

                                            return cellGroups.map((g) => {
                                                const span = g.to - g.from;
                                                const color = subjectColorMap.get(g.subject.toLowerCase()) || TIMETABLE_COLORS[0];
                                                const sub = subjectForGroup(g);
                                                const isEnrolled = g.requestStatus === 'enrolled';
                                                const isPending = g.requestStatus === 'pending';
                                                const isRejected = g.requestStatus === 'rejected';

                                                return (
                                                    <td
                                                        key={`${day}-${g._id}-${g.requestStatus}`}
                                                        className="regTimetableCell regTimetableEvent"
                                                        rowSpan={span}
                                                        style={{
                                                            background: isRejected ? '#f5f5f5' : color.bg,
                                                            borderLeft: `4px solid ${isRejected ? '#999' : isPending ? '#ffa726' : color.border}`,
                                                            opacity: isRejected ? 0.6 : 1,
                                                        }}
                                                    >
                                                        <div className="regEventContent">
                                                            <strong style={{ color: isRejected ? '#666' : color.text }}>
                                                                {formatSubjectCode(g.subject)}
                                                            </strong>
                                                            <span className={getTypeClass(g.type)} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                                {t(`groupsSchedule.typeValues.${g.type.toLowerCase()}`, { defaultValue: g.type })}
                                                            </span>
                                                            {sub && (
                                                                <span className="regEventName">{sub.name}</span>
                                                            )}
                                                            {/* Status badge */}
                                                            <span className={`regStatusBadge regStatus${g.requestStatus.charAt(0).toUpperCase() + g.requestStatus.slice(1)}`} style={{ fontSize: '0.6rem', marginTop: '2px' }}>
                                                                {t(`registration.status.${g.requestStatus === 'enrolled' ? 'approved' : g.requestStatus}`)}
                                                            </span>
                                                            {/* Action button */}
                                                            {isEnrolled && (
                                                                <button
                                                                    className="regEventRemoveBtn"
                                                                    disabled={!!actionLoading}
                                                                    onClick={async () => {
                                                                        const pairGroups = myGroups.filter(
                                                                            (mg: GroupData) => mg.subject.toLowerCase() === g.subject.toLowerCase() && mg.number === g.number
                                                                        );
                                                                        await handleRemovePair(pairGroups.map(pg => pg._id));
                                                                    }}
                                                                    title={t("registration.removeBtn")}
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                            {isPending && g.requestId && (
                                                                <button
                                                                    className="regEventRemoveBtn"
                                                                    disabled={!!actionLoading}
                                                                    onClick={() => {
                                                                        // Find ALL pending request IDs for the same subject + group number pair
                                                                        const pairRequestIds = myGroupsWithStatus
                                                                            .filter(mg =>
                                                                                mg.subject.toLowerCase() === g.subject.toLowerCase() &&
                                                                                mg.number === g.number &&
                                                                                mg.requestStatus === 'pending' &&
                                                                                mg.requestId
                                                                            )
                                                                            .map(mg => mg.requestId!)
                                                                        handleCancelRequest(pairRequestIds);
                                                                    }}
                                                                    title={t("registration.cancelRequestBtn")}
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            });
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {myGroupsWithStatus.length === 0 && (
                        <div className="empty-state" style={{ marginTop: 16 }}>
                            <p>{t("registration.noRegistered")}</p>
                        </div>
                    )}

                    {/* ── My Requests Table ── */}
                    {myRequests.length > 0 && (
                        <div className="regRequestsSection" style={{ marginTop: 24 }}>
                            <h3 className="regSectionTitle">📋 {t("registration.myRequestsTitle")}</h3>
                            <table className="regRequestsTable" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                                <thead>
                                    <tr>
                                        <th>{t("registration.colSubject")}</th>
                                        <th>{t("registration.colGroup")}</th>
                                        <th>{t("registration.colType")}</th>
                                        <th>{t("registration.colStatus")}</th>
                                        <th>{t("registration.colActions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myRequests.map((req: EnrollmentRequestData) => {
                                        const reqGroupId = getGroupId(req.group);
                                        const grp = typeof req.group === 'object' && req.group !== null
                                            ? req.group as GroupData
                                            : groups.find((g: GroupData) => g._id === reqGroupId);
                                        if (!grp) return null;
                                        const sub = subjectForGroup(grp);
                                        return (
                                            <tr key={req._id}>
                                                <td>
                                                    <strong>{formatSubjectCode(grp.subject)}</strong>
                                                    {sub && <span className="regRequestSubName">{sub.name}</span>}
                                                </td>
                                                <td>{t("groupsSchedule.groupNumber", { number: grp.number })}</td>
                                                <td>
                                                    <span className={getTypeClass(grp.type)}>
                                                        {t(`groupsSchedule.typeValues.${grp.type.toLowerCase()}`, { defaultValue: grp.type })}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`regStatusBadge regStatus${req.status.charAt(0).toUpperCase() + req.status.slice(1)}`}>
                                                        {t(`registration.status.${req.status}`)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {req.status === 'pending' && (
                                                        <button
                                                            className="btn-danger btn-sm"
                                                            disabled={!!actionLoading}
                                                            onClick={() => {
                                                                // Find ALL pending requests for the same subject + group number pair
                                                                const pairRequestIds = myRequests
                                                                    .filter((r: EnrollmentRequestData) => {
                                                                        if (r.status !== 'pending') return false;
                                                                        const rGrp = typeof r.group === 'object' && r.group !== null
                                                                            ? r.group as GroupData
                                                                            : groups.find((g: GroupData) => g._id === getGroupId(r.group));
                                                                        return rGrp &&
                                                                            (rGrp as GroupData).subject.toLowerCase() === grp.subject.toLowerCase() &&
                                                                            (rGrp as GroupData).number === grp.number;
                                                                    })
                                                                    .map((r: EnrollmentRequestData) => r._id);
                                                                handleCancelRequest(pairRequestIds);
                                                            }}
                                                        >
                                                            {t("registration.cancelRequestBtn")}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ════════════════════════════════════
                    RIGHT: Subject Selection Sidebar
                   ════════════════════════════════════ */}
                <div className="regSidebar">
                    <h3 className="regSectionTitle">📚 {t("registration.availableTitle")}</h3>

                    <div className="regDropdownRow">
                        <label htmlFor="reg-subject-select">{t("registration.chooseSubject")}</label>
                        <select
                            id="reg-subject-select"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                        >
                            <option value="">{t("registration.selectPlaceholder")}</option>
                            {availableSubjects.map((s: SubjectData) => (
                                <option key={s._id} value={s._id}>
                                    {formatSubjectCode(s.code)} — {s.name} ({s.creditHours} {t("registration.hrs")})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Co-requisite notice */}
                    {selectedSubject && (() => {
                        const sub = subjectById.get(selectedSubject);
                        if (!sub || !sub.corequisites || sub.corequisites.length === 0) return null;
                        return (
                            <div className="info regCoreqNotice">
                                ⚠️ {t("registration.corequisiteNotice")}: {sub.corequisites.map((c: { code: string; name: string }) => formatSubjectCode(c.code || c.name)).join(", ")}
                            </div>
                        );
                    })()}

                    {/* ── Groups for selected subject ── */}
                    {selectedSubject && groupsForSelected.length === 0 && (
                        <div className="empty-state" style={{ marginTop: 16 }}>
                            <p>{t("registration.noGroupsForSubject")}</p>
                        </div>
                    )}

                    {groupsForSelected.length > 0 && (() => {
                        const byNumber = new Map<number, GroupData[]>();
                        groupsForSelected.forEach((g: GroupData) => {
                            const arr = byNumber.get(g.number) || [];
                            arr.push(g);
                            byNumber.set(g.number, arr);
                        });

                        return (
                            <div className="regGroupCards">
                                {Array.from(byNumber.entries()).map(([num, pair]) => {
                                    const lecture = pair.find((g: GroupData) => g.type.toLowerCase() === "lecture");
                                    const coreq  = pair.find((g: GroupData) => g.type.toLowerCase() !== "lecture");
                                    const allIds = pair.map((g: GroupData) => g._id);

                                    const isEnrolled = student
                                        ? pair.some((g: GroupData) => getStudentObjectId(g.students).includes(student._id))
                                        : false;

                                    // Check if subject already has a pending/approved request for ANY group
                                    const subjectCode = pair[0]?.subject?.toLowerCase() || '';
                                    const hasExistingRequestForSubject = requestedSubjectCodes.has(subjectCode);

                                    // Check if there are pending requests for this pair
                                    const pendingRequestIds = allIds
                                        .map((gId: string) => myRequests.find((r: EnrollmentRequestData) => getGroupId(r.group) === gId && r.status === 'pending')?._id)
                                        .filter(Boolean) as string[];
                                    const hasPendingRequest = pendingRequestIds.length > 0;

                                    return (
                                        <div key={num} className={`regGroupCard ${isEnrolled ? "regGroupCardActive" : ""}`}>
                                            <div className="regGroupCardHeader">
                                                <span className="regGroupNumber">
                                                    {t("groupsSchedule.groupNumber", { number: num })}
                                                </span>

                                            </div>

                                            <div className="regGroupCardBody">
                                                {lecture && (
                                                    <div className="regGroupPairBlock">
                                                        <span className={getTypeClass("lecture")}>
                                                            {t("groupsSchedule.typeValues.lecture")}
                                                        </span>
                                                        <div className="regGroupDetail">
                                                            <span className="regGroupDetailIcon">📅</span>
                                                            <span>{getDayDisplay(lecture.day)}</span>
                                                        </div>
                                                        <div className="regGroupDetail">
                                                            <span className="regGroupDetailIcon">🕐</span>
                                                            <span>{formatTime(lecture.from, t)} – {formatTime(lecture.to, t)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {coreq && (
                                                    <div className="regGroupPairBlock" style={{marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--color-border)'}}>
                                                        <span className={getTypeClass(coreq.type)}>
                                                            {t(`groupsSchedule.typeValues.${coreq.type.toLowerCase()}`, { defaultValue: coreq.type })}
                                                        </span>
                                                        <div className="regGroupDetail">
                                                            <span className="regGroupDetailIcon">📅</span>
                                                            <span>{getDayDisplay(coreq.day)}</span>
                                                        </div>
                                                        <div className="regGroupDetail">
                                                            <span className="regGroupDetailIcon">🕐</span>
                                                            <span>{formatTime(coreq.from, t)} – {formatTime(coreq.to, t)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="regGroupCardFooter">
                                                {isEnrolled ? (
                                                    <button
                                                        className="btn-danger"
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleRemovePair(allIds)}
                                                    >
                                                        {actionLoading ? t("dashboardCommon.submitting") : t("registration.removeBtn")}
                                                    </button>
                                                ) : hasPendingRequest ? (
                                                    <button
                                                        className="btn-warning"
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleCancelRequest(pendingRequestIds)}
                                                    >
                                                        {actionLoading ? t("dashboardCommon.submitting") : t("registration.cancelRequestBtn")}
                                                    </button>
                                                ) : hasExistingRequestForSubject ? (
                                                    <button
                                                        className="btn-secondary"
                                                        disabled
                                                        title={t("registration.alreadyRequested")}
                                                    >
                                                        {t("registration.alreadyRequested")}
                                                    </button>
                                                ) : !registrationOpen ? (
                                                    <button
                                                        className="btn-secondary"
                                                        disabled
                                                        title={t("registration.errors.registrationClosed")}
                                                    >
                                                        {t("registration.errors.registrationClosed")}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-primary"
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleRequestPair(allIds)}
                                                    >
                                                        {actionLoading ? t("dashboardCommon.submitting") : t("registration.requestBtn")}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default RegisterSubjects;
