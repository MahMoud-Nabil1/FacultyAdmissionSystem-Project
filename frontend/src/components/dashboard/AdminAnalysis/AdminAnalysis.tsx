import React, { useState, useEffect } from 'react';
import './AdminAnalysis.css';
import { getRegistrationStats } from '../../../services/api';
import { useTranslation } from 'react-i18next';

export interface AdminAnalysisProps {
    totalStudents?: number;
    finishedRegistration?: number;
    didNotFinishRegistration?: number;
}

export const AdminAnalysis: React.FC<AdminAnalysisProps> = ({
                                                                totalStudents: propsTotal,
                                                                finishedRegistration: propsFinished,
                                                                didNotFinishRegistration: propsDidNotFinish,
                                                            }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalStudents: 0,
        finishedRegistration: 0,
        didNotFinishRegistration: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        if (propsTotal !== undefined && propsFinished !== undefined && propsDidNotFinish !== undefined) {
            setStats({
                totalStudents: propsTotal,
                finishedRegistration: propsFinished,
                didNotFinishRegistration: propsDidNotFinish
            });
            setLoading(false);
            return;
        }


        getRegistrationStats()
            .then(data => {
                setStats({
                    totalStudents: data.totalStudents || 0,
                    finishedRegistration: data.finishedRegistration || 0,
                    didNotFinishRegistration: data.didNotFinishRegistration || 0
                });
            })
            .catch(err => console.error("Failed to load stats", err))
            .finally(() => setLoading(false));
    }, [propsTotal, propsFinished, propsDidNotFinish]);

    const { totalStudents, finishedRegistration, didNotFinishRegistration } = stats;

    if (loading) {
        return <div className="admin-analysis-container"><p>{t('adminAnalysis.loading')}</p></div>;
    }

    return (
        <div className="admin-analysis-container">
            <h2 className="admin-analysis-title">
                {t('adminAnalysis.title')}
            </h2>


            <div className="admin-analysis-grid">

                <div className="admin-analysis-card">
                    <div className="admin-analysis-icon-wrapper icon-primary">
                        <svg className="admin-analysis-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="admin-analysis-label">{t('adminAnalysis.totalStudents')}</p>
                    <h3 className="admin-analysis-value">{totalStudents.toLocaleString()}</h3>
                </div>


                <div className="admin-analysis-card">
                    <div className="admin-analysis-icon-wrapper icon-success">
                        <svg className="admin-analysis-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="admin-analysis-label">{t('adminAnalysis.finishedRegistration')}</p>
                    <h3 className="admin-analysis-value">{finishedRegistration.toLocaleString()}</h3>
                </div>


                <div className="admin-analysis-card">
                    <div className="admin-analysis-icon-wrapper icon-error">
                        <svg className="admin-analysis-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="admin-analysis-label">{t('adminAnalysis.didNotFinish')}</p>
                    <h3 className="admin-analysis-value">{didNotFinishRegistration.toLocaleString()}</h3>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalysis;
