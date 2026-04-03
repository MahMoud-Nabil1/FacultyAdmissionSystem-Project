import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from '../../context/AuthContext';
import { apiGet, getSystemSettings } from '../../services/api';
import "./Groups.css";

// --- Constants ---
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface Subject {
    _id: string;
    code: string;
    name: string;
    creditHours: number;
}

interface Group {
    _id: string;
    number: number;
    subject: string;
    type: string;
    from: number;
    to: number;
    day: string;
    capacity: number;
    students: string[]; // IDs of enrolled students
}

const Groups: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, token } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isStudent = user?.role === 'student';
    const isEnglish = i18n.language?.startsWith("en");

    // Core Data
    const [groups, setGroups] = useState<Group[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [myRequests, setMyRequests] = useState<any[]>([]); // To track waitlist status
    const [settings, setSettings] = useState({ registrationOpen: true, withdrawalOpen: true });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [filterDay, setFilterDay] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [groupsRes, subjectsRes, settingsRes] = await Promise.all([
                apiGet('/groups'),
                apiGet('/subjects'),
                getSystemSettings()
            ]);

            if (groupsRes.res.ok) setGroups(groupsRes.data);
            if (subjectsRes.res.ok) setSubjects(subjectsRes.data);
            if (settingsRes) setSettings({
                registrationOpen: settingsRes.registrationOpen,
                withdrawalOpen: settingsRes.withdrawalOpen
            });

            if (isStudent) {
                const requestsRes = await apiGet('/groups/my-requests');
                if (requestsRes.res.ok) setMyRequests(requestsRes.data);
            }
        } catch (err) {
            setError(t("groupsSchedule.errors.fetchFailed"));
        } finally {
            setLoading(false);
        }
    }, [t, isStudent]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleJoin = async (groupId: string) => {
        try {
            const res = await fetch(`/api/groups/${groupId}/request`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchData();
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error("Join failed", err);
        }
    };

    const handleLeave = async (groupId: string) => {
        if (!window.confirm(t("dashboardCommon.confirmDelete"))) return;
        try {
            const res = await fetch(`/api/groups/${groupId}/students/me`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error("Leave failed", err);
        }
    };

    const handleCancelWaitlist = async (requestId: string) => {
        if (!window.confirm("Cancel your waitlist request?")) return;
        try {
            const res = await fetch(`/api/groups/requests/${requestId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error("Cancel failed", err);
        }
    };

    // Helpers
    const formatSubject = (subject: string) =>
        subject.replace(/([a-zA-Z]+)(\d+)/, '$1 $2').toUpperCase();

    const getGroupStatus = (group: Group) => {
        const isEnrolled = group.students.includes(user?.mongoId || "");
        const waitlistRequest = myRequests.find(
            r => r.group?._id === group._id && (r.status === 'pending' || r.status === 'processing' || r.status === 'rejected')
        );
        const isFull = group.students.length >= group.capacity;

        return { isEnrolled, waitlistRequest, isFull };
    };

    const renderActionButtons = (group: Group) => {
        if (isAdmin) {
            return <button className="delete-btn" onClick={() => console.log("Delete logic here")}>🗑️</button>;
        }
        if (!isStudent) return null;

        const { isEnrolled, waitlistRequest, isFull } = getGroupStatus(group);

        if (isEnrolled) {
            return (
                <button 
                    className="leave-btn" 
                    onClick={() => handleLeave(group._id)}
                    disabled={!settings.withdrawalOpen}
                    title={!settings.withdrawalOpen ? "Withdrawal is closed" : ""}
                >
                    Leave Group
                </button>
            );
        }

        if (waitlistRequest) {
            return (
                <div className="status-container">
                    {waitlistRequest.status === 'rejected' ? (
                        <span className="rejected-status">Rejected (Conflict/Full)</span>
                    ) : (
                        <button 
                            className="waitlist-cancel-btn" 
                            onClick={() => handleCancelWaitlist(waitlistRequest._id)}
                            disabled={!settings.registrationOpen}
                        >
                            Waitlisted (Cancel)
                        </button>
                    )}
                </div>
            );
        }

        return (
            <button
                className={isFull ? "waitlist-btn" : "join-btn"}
                onClick={() => handleJoin(group._id)}
                disabled={!settings.registrationOpen}
                title={!settings.registrationOpen ? "Registration is closed" : ""}
            >
                {isFull ? "Join Waitlist" : "Register"}
            </button>
        );
    };

    const filteredGroups = useMemo(() => {
        return groups.filter(g => {
            const { isEnrolled } = getGroupStatus(g);

            // If registration is closed, student should only see groups they are enrolled in
            if (isStudent && !settings.registrationOpen) {
                if (!isEnrolled) return false;
            }

            const matchesDay = filterDay === "all" || g.day.toLowerCase() === filterDay.toLowerCase();
            const matchesSearch = g.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                formatSubject(g.subject).toLowerCase().includes(searchTerm.toLowerCase());
            return matchesDay && matchesSearch;
        });
    }, [groups, filterDay, searchTerm]);

    const formatTime = (hour: number) => {
        const period = hour >= 12 ? t("groupsSchedule.pm") : t("groupsSchedule.am");
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    if (loading) return <div className="groupsLoading">{t("groupsSchedule.loading")}</div>;

    return (
        <div className="dashboard-container groupsContainer">
            <div className="table-header">
                <h2>{t("groupsSchedule.title")}</h2>
                {isAdmin && (
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + {t("groupsSchedule.addNew")}
                    </button>
                )}
            </div>

            {/* Filter Controls */}
            <div className="groupsControlsContainer">
                <div className="groupsSearchBox">
                    <input
                        type="text"
                        placeholder={t("groupsSchedule.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="groupsSearchInput"
                    />
                </div>
                <div className="groupsFilterGroup">
                    <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="groupsSelect">
                        <option value="all">{t("groupsSchedule.allDays")}</option>
                        {DAYS.map(day => (
                            <option key={day} value={day}>{t(`days.${day}`)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="groupsTableWrapper">
                <table className="groupsTable">
                    <thead>
                        <tr>
                            {isEnglish ? (
                                <>
                                    <th>{t("groupsSchedule.time")}</th>
                                    <th>{t("groupsSchedule.day")}</th>
                                    <th>{t("groupsSchedule.type")}</th>
                                    <th>{t("groupsSchedule.group")}</th>
                                    <th>{t("groupsSchedule.subject")}</th>
                                    {isAdmin && <th>{t("dashboardCommon.actions")}</th>}
                                </>
                            ) : (
                                <>
                                    <th>{t("groupsSchedule.subject")}</th>
                                    <th>{t("groupsSchedule.group")}</th>
                                    <th>{t("groupsSchedule.type")}</th>
                                    <th>{t("groupsSchedule.day")}</th>
                                    <th>{t("groupsSchedule.time")}</th>
                                    {isAdmin && <th>{t("dashboardCommon.actions")}</th>}
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGroups.map((group) => (
                            <tr key={group._id}>
                                {isEnglish ? (
                                    <>
                                        <td className="groupsTimeSlot">{formatTime(group.from)} - {formatTime(group.to)}</td>
                                        <td>{t(`days.${group.day.toLowerCase()}`)}</td>
                                        <td>
                                            <span className={`groupsBadge groupsBadge${group.type}`}>
                                                {group.type}
                                            </span>
                                        </td>
                                        <td><strong>{group.number}</strong></td>
                                        <td className="groupsSubjectCell">{formatSubject(group.subject)}</td>
                                        {isAdmin && <td>{renderActionButtons(group)}</td>}
                                    </>
                                ) : (
                                    <>
                                        <td className="groupsSubjectCell">{formatSubject(group.subject)}</td>
                                        <td><strong>{group.number}</strong></td>
                                        <td>
                                            <span className={`groupsBadge groupsBadge${group.type}`}>
                                                {group.type}
                                            </span>
                                        </td>
                                        <td>{t(`days.${group.day.toLowerCase()}`)}</td>
                                        <td className="groupsTimeSlot">{formatTime(group.from)} - {formatTime(group.to)}</td>
                                        {isAdmin && <td>{renderActionButtons(group)}</td>}
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredGroups.length === 0 && (
                <div className="groupsEmptyState">
                    {t("groupPanel.noGroupsMessage")}
                </div>
            )}
        </div>
    );
};

export default Groups;
