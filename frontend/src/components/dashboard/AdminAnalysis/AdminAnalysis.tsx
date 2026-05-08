import React, { useState, useEffect } from 'react';
import './AdminAnalysis.css';
import { getRegistrationStats } from '../../../services/api';
import { useTranslation } from 'react-i18next';

interface LevelStat {
    level: string;
    total: number;
    finished: number;
    notFinished: number;
    avgGpa: number;
}

interface GpaBucket {
    range: string;
    count: number;
}

interface Stats {
    totalStudents: number;
    finishedRegistration: number;
    didNotFinishRegistration: number;
    avgGpa: number;
    byLevel: LevelStat[];
}

const LEVEL_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

const AdminAnalysis: React.FC = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');

    useEffect(() => {
        getRegistrationStats()
            .then((data: any) => setStats(data))
            .catch(() => setError(t('adminAnalysis.loadError')))
            .finally(() => setLoading(false));
    }, [t]);

    if (loading) {
        return (
            <div className="aa-container">
                <div className="aa-loading">
                    <div className="aa-spinner" />
                    <p>{t('adminAnalysis.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="aa-container">
                <div className="aa-error">{error || t('adminAnalysis.loadError')}</div>
            </div>
        );
    }

    const registrationRate = stats.totalStudents > 0
        ? Math.round((stats.finishedRegistration / stats.totalStudents) * 100)
        : 0;

    const maxLevelTotal = Math.max(...(stats.byLevel?.map(l => l.total) ?? [1]), 1);

    return (
        <div className="aa-container">
            <h2 className="aa-page-title">{t('adminAnalysis.title')}</h2>

            {/* ── Summary Cards ── */}
            <div className="aa-summary-grid">
                <div className="aa-card aa-card--blue">
                    <div className="aa-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="aa-card-body">
                        <p className="aa-card-label">{t('adminAnalysis.totalStudents')}</p>
                        <h3 className="aa-card-value">{stats.totalStudents.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="aa-card aa-card--green">
                    <div className="aa-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="aa-card-body">
                        <p className="aa-card-label">{t('adminAnalysis.finishedRegistration')}</p>
                        <h3 className="aa-card-value">{stats.finishedRegistration.toLocaleString()}</h3>
                        <span className="aa-card-badge aa-badge--green">{registrationRate}%</span>
                    </div>
                </div>

                <div className="aa-card aa-card--red">
                    <div className="aa-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="aa-card-body">
                        <p className="aa-card-label">{t('adminAnalysis.didNotFinish')}</p>
                        <h3 className="aa-card-value">{stats.didNotFinishRegistration.toLocaleString()}</h3>
                        <span className="aa-card-badge aa-badge--red">{100 - registrationRate}%</span>
                    </div>
                </div>

                <div className="aa-card aa-card--purple">
                    <div className="aa-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div className="aa-card-body">
                        <p className="aa-card-label">{t('adminAnalysis.avgGpa')}</p>
                        <h3 className="aa-card-value">{stats.avgGpa.toFixed(2)}</h3>
                        <span className="aa-card-badge aa-badge--purple">{t('adminAnalysis.outOf5')}</span>
                    </div>
                </div>
            </div>

            {/* ── Registration Rate Bar ── */}
            <div className="aa-section">
                <h3 className="aa-section-title">{t('adminAnalysis.overallRate')}</h3>
                <div className="aa-rate-bar-wrap">
                    <div className="aa-rate-bar-track">
                        <div
                            className="aa-rate-bar-fill"
                            style={{ width: `${registrationRate}%` }}
                        />
                    </div>
                    <span className="aa-rate-label">{registrationRate}% {t('adminAnalysis.registered')}</span>
                </div>
            </div>

            {/* ── Per-Level Breakdown ── */}
            <div className="aa-section">
                <h3 className="aa-section-title">{t('adminAnalysis.byLevel')}</h3>
                <div className="aa-level-grid">
                    {(stats.byLevel ?? []).map((lvl, i) => {
                        const rate = lvl.total > 0 ? Math.round((lvl.finished / lvl.total) * 100) : 0;
                        const color = LEVEL_COLORS[i] ?? '#6b7280';
                        return (
                            <div className="aa-level-card" key={lvl.level}>
                                <div className="aa-level-header" style={{ borderColor: color }}>
                                    <span className="aa-level-badge" style={{ background: color }}>
                                        {t('adminAnalysis.level')} {lvl.level}
                                    </span>
                                    <span className="aa-level-total">{lvl.total} {t('adminAnalysis.students')}</span>
                                </div>

                                {/* population bar relative to largest level */}
                                <div className="aa-mini-bar-track">
                                    <div
                                        className="aa-mini-bar-fill"
                                        style={{
                                            width: `${Math.round((lvl.total / maxLevelTotal) * 100)}%`,
                                            background: color,
                                        }}
                                    />
                                </div>

                                <div className="aa-level-stats">
                                    <div className="aa-level-stat">
                                        <span className="aa-dot aa-dot--green" />
                                        <span>{t('adminAnalysis.finished')}: <strong>{lvl.finished}</strong></span>
                                    </div>
                                    <div className="aa-level-stat">
                                        <span className="aa-dot aa-dot--red" />
                                        <span>{t('adminAnalysis.notFinished')}: <strong>{lvl.notFinished}</strong></span>
                                    </div>
                                    <div className="aa-level-stat">
                                        <span className="aa-dot aa-dot--purple" />
                                        <span>{t('adminAnalysis.avgGpa')}: <strong>{lvl.avgGpa.toFixed(2)}</strong></span>
                                    </div>
                                </div>

                                {/* registration rate progress */}
                                <div className="aa-level-progress-wrap">
                                    <div className="aa-level-progress-track">
                                        <div
                                            className="aa-level-progress-fill"
                                            style={{ width: `${rate}%`, background: color }}
                                        />
                                    </div>
                                    <span className="aa-level-rate">{rate}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Per-Level Table ── */}
            <div className="aa-section">
                <h3 className="aa-section-title">{t('adminAnalysis.levelTable')}</h3>
                <div className="aa-table-wrap">
                    <table className="aa-table">
                        <thead>
                            <tr>
                                <th>{t('adminAnalysis.level')}</th>
                                <th>{t('adminAnalysis.totalStudents')}</th>
                                <th>{t('adminAnalysis.finished')}</th>
                                <th>{t('adminAnalysis.notFinished')}</th>
                                <th>{t('adminAnalysis.avgGpa')}</th>
                                <th>{t('adminAnalysis.regRate')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats.byLevel ?? []).map((lvl, i) => {
                                const rate = lvl.total > 0 ? Math.round((lvl.finished / lvl.total) * 100) : 0;
                                const color = LEVEL_COLORS[i] ?? '#6b7280';
                                return (
                                    <tr key={lvl.level}>
                                        <td>
                                            <span className="aa-table-level-badge" style={{ background: color }}>
                                                {t('adminAnalysis.level')} {lvl.level}
                                            </span>
                                        </td>
                                        <td><strong>{lvl.total}</strong></td>
                                        <td><span className="aa-table-chip aa-chip--green">{lvl.finished}</span></td>
                                        <td><span className="aa-table-chip aa-chip--red">{lvl.notFinished}</span></td>
                                        <td>{lvl.avgGpa.toFixed(2)}</td>
                                        <td>
                                            <div className="aa-table-rate-wrap">
                                                <div className="aa-table-rate-track">
                                                    <div
                                                        className="aa-table-rate-fill"
                                                        style={{ width: `${rate}%`, background: color }}
                                                    />
                                                </div>
                                                <span>{rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AdminAnalysis;
