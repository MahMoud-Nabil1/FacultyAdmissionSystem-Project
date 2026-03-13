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
    const [showModal, setShowModal] = useState(false);
    
    // Form states
    const [formSubject, setFormSubject] = useState("");
    const [formNumber, setFormNumber] = useState<number | "">("");
    const [formType, setFormType] = useState("");
    const [formDay, setFormDay] = useState("");
    const [formFrom, setFormFrom] = useState<number | "">("");
    const [formTo, setFormTo] = useState<number | "">("");
    const [formCapacity, setFormCapacity] = useState<number | "">(30);
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
    const [submitting, setSubmitting] = useState(false);

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

    const resetForm = () => {
        setFormSubject("");
        setFormNumber("");
        setFormType("");
        setFormDay("");
        setFormFrom("");
        setFormTo("");
        setFormCapacity(30);
        setFormErrors({});
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};

        if (!formSubject) errors.subject = t("groupsSchedule.errors.subjectRequired");
        if (!formNumber) errors.number = t("groupsSchedule.errors.numberRequired");
        if (!formType) errors.type = t("groupsSchedule.errors.typeRequired");
        if (!formDay) errors.day = t("groupsSchedule.errors.dayRequired");
        if (!formFrom) errors.from = t("groupsSchedule.errors.fromRequired");
        if (!formTo) errors.to = t("groupsSchedule.errors.toRequired");
        if (!formCapacity) errors.capacity = t("groupsSchedule.errors.capacityRequired");

        if (formFrom && formTo && Number(formFrom) >= Number(formTo)) {
            errors.time = t("groupsSchedule.errors.timeInvalid");
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        const groupData = {
            subject: formSubject.toLowerCase(),
            number: Number(formNumber),
            type: formType.toLowerCase(),
            day: formDay.toLowerCase(),
            from: Number(formFrom),
            to: Number(formTo),
            capacity: Number(formCapacity)
        };

        try {
            const response = await fetch(`${API_URL}/api/groups`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(groupData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || t("groupsSchedule.errors.createFailed"));
            }

            await fetchGroups();
            setShowModal(false);
            resetForm();
        } catch (err: any) {
            console.error("Error creating group:", err);
            setFormErrors({ submit: err.message || t("groupsSchedule.errors.createFailed") });
        } finally {
            setSubmitting(false);
        }
    };

    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="groupsLoading">{t("groupsSchedule.loading")}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <h2>{t("groupsSchedule.title")}</h2>
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
        <div className="dashboard-container groupsContainer">
            <div className="table-header">
                <h2>{t("groupsSchedule.title")}</h2>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    + {t("groupsSchedule.addNew")}
                </button>
            </div>

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

            {/* Add Group Modal */}
            {showModal && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowModal(false);
                        resetForm();
                    }
                }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{t("groupsSchedule.addNew")}</h3>
                            <button className="modal-close" onClick={() => {
                                setShowModal(false);
                                resetForm();
                            }} type="button">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                {formErrors.submit && <p className="error">{formErrors.submit}</p>}
                                {formErrors.time && <p className="error">{formErrors.time}</p>}

                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder={t("groupsSchedule.subject") + " (e.g., math101, cs201)"}
                                        value={formSubject}
                                        onChange={(e) => {
                                            setFormSubject(e.target.value);
                                            setFormErrors({...formErrors, subject: ""});
                                        }}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        type="number"
                                        placeholder={t("groupsSchedule.group") + " #"}
                                        value={formNumber}
                                        onChange={(e) => {
                                            setFormNumber(Number(e.target.value));
                                            setFormErrors({...formErrors, number: ""});
                                        }}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <select
                                        value={formType}
                                        onChange={(e) => {
                                            setFormType(e.target.value);
                                            setFormErrors({...formErrors, type: ""});
                                        }}
                                        required
                                    >
                                        <option value="">{t("groupsSchedule.type")} - {t("dashboardCommon.select")}</option>
                                        <option value="lecture">{t("groupsSchedule.typeValues.lecture")}</option>
                                        <option value="lab">{t("groupsSchedule.typeValues.lab")}</option>
                                        <option value="tutorial">{t("groupsSchedule.typeValues.tutorial")}</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <select
                                        value={formDay}
                                        onChange={(e) => {
                                            setFormDay(e.target.value);
                                            setFormErrors({...formErrors, day: ""});
                                        }}
                                        required
                                    >
                                        <option value="">{t("groupsSchedule.day")} - {t("dashboardCommon.select")}</option>
                                        <option value="monday">{t("days.monday")}</option>
                                        <option value="tuesday">{t("days.tuesday")}</option>
                                        <option value="wednesday">{t("days.wednesday")}</option>
                                        <option value="thursday">{t("days.thursday")}</option>
                                        <option value="friday">{t("days.friday")}</option>
                                        <option value="saturday">{t("days.saturday")}</option>
                                        <option value="sunday">{t("days.sunday")}</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <select
                                        value={formFrom}
                                        onChange={(e) => {
                                            setFormFrom(Number(e.target.value));
                                            setFormErrors({...formErrors, from: "", time: ""});
                                        }}
                                        required
                                    >
                                        <option value="">{t("groupsSchedule.from")} - {t("dashboardCommon.select")}</option>
                                        {hours.map(h => (
                                            <option key={h} value={h}>{formatTime(h)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <select
                                        value={formTo}
                                        onChange={(e) => {
                                            setFormTo(Number(e.target.value));
                                            setFormErrors({...formErrors, to: "", time: ""});
                                        }}
                                        required
                                    >
                                        <option value="">{t("groupsSchedule.to")} - {t("dashboardCommon.select")}</option>
                                        {hours.map(h => (
                                            <option key={h} value={h}>{formatTime(h)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <input
                                        type="number"
                                        placeholder={t("groupsSchedule.capacity")}
                                        value={formCapacity}
                                        onChange={(e) => {
                                            setFormCapacity(Number(e.target.value));
                                            setFormErrors({...formErrors, capacity: ""});
                                        }}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}>
                                        {t("dashboardCommon.cancel")}
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={submitting}>
                                        {submitting ? t("dashboardCommon.submitting") : t("dashboardCommon.submit")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;