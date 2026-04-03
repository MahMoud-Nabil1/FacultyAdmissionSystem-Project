import React from 'react';
import './AdminAnalysis.css';

export interface AdminAnalysisProps {
    totalStudents: number;
    finishedRegistration: number;
    didNotFinishRegistration: number;
}

export const AdminAnalysis: React.FC<AdminAnalysisProps> = ({
                                                                totalStudents,
                                                                finishedRegistration,
                                                                didNotFinishRegistration,
                                                            }) => {
    return (
        <div className="admin-analysis-container">
            <h2 className="admin-analysis-title">
                Student Registration Analysis
            </h2>

            {/* Grid Layout optimized for Web (Larger Screens) */}
            <div className="admin-analysis-grid">
                {/* Total Students Card */}
                <div className="admin-analysis-card">
                    <div className="admin-analysis-icon-wrapper icon-primary">
                        <svg className="admin-analysis-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="admin-analysis-label">Total Students</p>
                    <h3 className="admin-analysis-value">{totalStudents.toLocaleString()}</h3>
                </div>

                {/* Finished Registration Card */}
                <div className="admin-analysis-card">
                    <div className="admin-analysis-icon-wrapper icon-success">
                        <svg className="admin-analysis-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="admin-analysis-label">Finished Registration</p>
                    <h3 className="admin-analysis-value">{finishedRegistration.toLocaleString()}</h3>
                </div>

                {/* Did Not Finish Registration Card */}
                <div className="admin-analysis-card">
                    <div className="admin-analysis-icon-wrapper icon-error">
                        <svg className="admin-analysis-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="admin-analysis-label">Did Not Finish</p>
                    <h3 className="admin-analysis-value">{didNotFinishRegistration.toLocaleString()}</h3>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalysis;
