import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./Groups.css";

interface Group {
    _id: string;
    number: number;
    subject: string;
    type: string;
    from: number;
    to: number;
    day: string;
    capacity: number;
}

const Groups: React.FC = () => {
    const { t } = useTranslation();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filterDay, setFilterDay] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // API URL
    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token"); // get JWT
            if (!token) throw new Error("No token found. Please login.");

            const res = await fetch(`${API_URL}/api/groups`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error(t("groupsSchedule.errors.endpointNotFound"));
                } else if (res.status === 401) {
                    throw new Error(t("groupsSchedule.errors.unauthorized"));
                } else {
                    throw new Error(t("groupsSchedule.errors.httpStatus", { status: res.status }));
                }
            }

            const data: Group[] = await res.json();
            setGroups(data);
        } catch (err) {
            console.error("Failed to fetch groups:", err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(t("groupsSchedule.errors.fetchFailed"));
            }
        } finally {
            setLoading(false);
        }
    };

    // Format subject for display
    const formatSubject = (subject: string) => {
        const match = subject.match(/([a-zA-Z]+)(\d+)/);
        if (match) {
            const prefix = match[1].toUpperCase();
            const number = match[2];
            return `${prefix} ${number}`;
        }
        return subject.toUpperCase();
    };

    // Filter groups by day AND search term
    const filteredGroups = groups.filter(group => {
        // First filter by day
        const dayMatch = filterDay === "all" || group.day.toLowerCase() === filterDay.toLowerCase();

        // Then filter by search term (subject name)
        const formattedSubject = formatSubject(group.subject).toLowerCase();
        const searchMatch = searchTerm === "" ||
            formattedSubject.includes(searchTerm.toLowerCase()) ||
            group.subject.toLowerCase().includes(searchTerm.toLowerCase());

        return dayMatch && searchMatch;
    });

    // Day options for filter
    const days = useMemo(
        () => ["all", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        []
    );

    const getTypeClass = (type: string) => {
        switch (type.toLowerCase()) {
            case "lecture":
                return "groupsBadge groupsBadgeLecture";
            case "lab":
                return "groupsBadge groupsBadgeLab";
            case "tutorial":
                return "groupsBadge groupsBadgeTutorial";
            default:
                return "groupsBadge groupsBadgeDefault";
        }
    };

    const formatTime = (hour: number) => {
        const period = hour >= 12 ? t("groupsSchedule.pm") : t("groupsSchedule.am");
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    const getDayDisplay = (day: string) => {
        if (day === "all") return t("groupsSchedule.allDays");
        return t(`days.${day}`);
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    if (loading) {
        return <div className="groupsLoading">{t("groupsSchedule.loading")}</div>;
    }

    if (error) {
        return (
            <div className="groupsContainer">
                <h1 className="groupsTitle">{t("groupsSchedule.title")}</h1>
                <div className="groupsError">
                    <strong>{t("groupsSchedule.errorPrefix")}</strong> {error}
                    <button onClick={fetchGroups} className="groupsPrimaryButton">
                        {t("groupsSchedule.tryAgain")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="groupsContainer">
            <h1 className="groupsTitle">{t("groupsSchedule.title")}</h1>

            <div className="groupsControlsContainer">
                {/* Search Box */}
                <div className="groupsSearchBox">
                    <label htmlFor="search">
                        🔍 {t("groupsSchedule.searchLabel")}
                    </label>
                    <input
                        id="search"
                        type="text"
                        placeholder={t("groupsSchedule.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="groupsSearchInput"
                    />
                    {searchTerm && (
                        <button
                            className="groupsClearButton"
                            onClick={clearSearch}
                        >
                            ✕ {t("groupsSchedule.clear")}
                        </button>
                    )}
                </div>

                {/* Day Filter */}
                <div className="groupsFilterGroup">
                    <label htmlFor="day-filter">{t("groupsSchedule.filterByDay")}</label>
                    <select
                        id="day-filter"
                        className="groupsSelect"
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                    >
                        {days.map(day => (
                            <option key={day} value={day}>
                                {getDayDisplay(day)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="groupsEmptyState">
                    <p>{t("groupsSchedule.noGroupsFound")}</p>
                    <div className="groupsAdminMessage">
                        <span className="groupsAdminEmail">{t("groupsSchedule.contactAdmin")}</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="groupsResultCount">
                        {t("groupsSchedule.showing", {
                            filtered: filteredGroups.length,
                            total: groups.length,
                        })}
                        {searchTerm &&
                            ` • ${t("groupsSchedule.searchTag", {
                                term: searchTerm,
                            })}`}
                        {filterDay !== "all" &&
                            ` • ${t("groupsSchedule.dayTag", {
                                day: getDayDisplay(filterDay),
                            })}`}
                    </div>

                    {filteredGroups.length === 0 ? (
                        <div className="groupsEmptyState">
                            <p>{t("groupsSchedule.noMatch")}</p>
                            <div className="groupsAdminMessage">
                                <span className="groupsAdminEmail">{t("groupsSchedule.contactAdmin")}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterDay("all");
                                }}
                                className="groupsPrimaryButton"
                            >
                                {t("groupsSchedule.clearAllFilters")}
                            </button>
                        </div>
                    ) : (
                        <div className="groupsTableWrapper">
                            <table className="groupsTable">
                                <thead>
                                <tr>
                                    <th className="groupsTh">{t("groupsSchedule.subject")}</th>
                                    <th className="groupsTh">{t("groupsSchedule.group")}</th>
                                    <th className="groupsTh">{t("groupsSchedule.type")}</th>
                                    <th className="groupsTh">{t("groupsSchedule.day")}</th>
                                    <th className="groupsTh">{t("groupsSchedule.time")}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredGroups.map((group, index) => (
                                    <tr
                                        key={group._id}
                                        className={index % 2 === 0 ? "groupsTrEven" : undefined}
                                    >
                                        <td className="groupsTd groupsSubjectCell">
                                            {formatSubject(group.subject)}
                                        </td>
                                        <td className="groupsTd">
                                            <strong>
                                                {t("groupsSchedule.groupNumber", { number: group.number })}
                                            </strong>
                                        </td>
                                        <td className="groupsTd">
                                            <span className={getTypeClass(group.type)}>
                                                {t(`groupsSchedule.typeValues.${group.type.toLowerCase()}`, {
                                                    defaultValue: group.type,
                                                })}
                                            </span>
                                        </td>
                                        <td className="groupsTd">
                                            {getDayDisplay(group.day)}
                                        </td>
                                        <td className="groupsTd">
                                            <span className="groupsTimeSlot">
                                                {formatTime(group.from)} - {formatTime(group.to)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Groups;