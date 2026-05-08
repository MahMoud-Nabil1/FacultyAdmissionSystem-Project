import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRegistrationStats } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';

/* ── Types (mirror the web) ── */
interface LevelStat {
    level: string;
    total: number;
    finished: number;
    notFinished: number;
    avgGpa: number;
}

interface Stats {
    totalStudents: number;
    finishedRegistration: number;
    didNotFinishRegistration: number;
    avgGpa: number;
    byLevel: LevelStat[];
}

const LEVEL_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

/* ── Small reusable bar ── */
const ProgressBar = ({ pct, color }: { pct: number; color: string }) => (
    <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
);

const bar = StyleSheet.create({
    track: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', flex: 1 },
    fill:  { height: '100%', borderRadius: 4 },
});

/* ── Component ── */
const AdminAnalysis: React.FC = () => {
    const { t } = useLanguage();
    const [stats,   setStats]   = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        getRegistrationStats()
            .then((data: any) => setStats(data))
            .catch(() => setError(t('adminAnalysis.loadError')))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── loading ── */
    if (loading) {
        return (
            <View style={s.center}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={s.loadingText}>{t('adminAnalysis.loading')}</Text>
            </View>
        );
    }

    /* ── error ── */
    if (error || !stats) {
        return (
            <View style={s.center}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={s.errorText}>{error || t('adminAnalysis.loadError')}</Text>
            </View>
        );
    }

    const registrationRate = stats.totalStudents > 0
        ? Math.round((stats.finishedRegistration / stats.totalStudents) * 100)
        : 0;

    const maxLevelTotal = Math.max(...(stats.byLevel?.map(l => l.total) ?? [1]), 1);

    /* ── render ── */
    return (
        <View style={s.container}>
            <Text style={s.pageTitle}>{t('adminAnalysis.title')}</Text>

            {/* ── 4 Summary Cards ── */}
            <View style={s.summaryGrid}>
                {/* Total Students */}
                <View style={[s.summaryCard, { borderTopColor: '#3b82f6' }]}>
                    <View style={[s.summaryIcon, { backgroundColor: '#eff6ff' }]}>
                        <Ionicons name="people-outline" size={22} color="#3b82f6" />
                    </View>
                    <Text style={s.summaryLabel}>{t('adminAnalysis.totalStudents')}</Text>
                    <Text style={s.summaryValue}>{stats.totalStudents.toLocaleString()}</Text>
                </View>

                {/* Finished */}
                <View style={[s.summaryCard, { borderTopColor: '#10b981' }]}>
                    <View style={[s.summaryIcon, { backgroundColor: '#ecfdf5' }]}>
                        <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
                    </View>
                    <Text style={s.summaryLabel}>{t('adminAnalysis.finishedRegistration')}</Text>
                    <Text style={s.summaryValue}>{stats.finishedRegistration.toLocaleString()}</Text>
                    <View style={[s.badge, { backgroundColor: '#d1fae5' }]}>
                        <Text style={[s.badgeText, { color: '#065f46' }]}>{registrationRate}%</Text>
                    </View>
                </View>

                {/* Did Not Finish */}
                <View style={[s.summaryCard, { borderTopColor: '#ef4444' }]}>
                    <View style={[s.summaryIcon, { backgroundColor: '#fef2f2' }]}>
                        <Ionicons name="alert-circle-outline" size={22} color="#ef4444" />
                    </View>
                    <Text style={s.summaryLabel}>{t('adminAnalysis.didNotFinish')}</Text>
                    <Text style={s.summaryValue}>{stats.didNotFinishRegistration.toLocaleString()}</Text>
                    <View style={[s.badge, { backgroundColor: '#fee2e2' }]}>
                        <Text style={[s.badgeText, { color: '#991b1b' }]}>{100 - registrationRate}%</Text>
                    </View>
                </View>

                {/* Avg GPA */}
                <View style={[s.summaryCard, { borderTopColor: '#8b5cf6' }]}>
                    <View style={[s.summaryIcon, { backgroundColor: '#f5f3ff' }]}>
                        <Ionicons name="bar-chart-outline" size={22} color="#8b5cf6" />
                    </View>
                    <Text style={s.summaryLabel}>{t('adminAnalysis.avgGpa')}</Text>
                    <Text style={s.summaryValue}>{(stats.avgGpa ?? 0).toFixed(2)}</Text>
                    <View style={[s.badge, { backgroundColor: '#ede9fe' }]}>
                        <Text style={[s.badgeText, { color: '#5b21b6' }]}>{t('adminAnalysis.outOf5')}</Text>
                    </View>
                </View>
            </View>

            {/* ── Overall Registration Rate Bar ── */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>{t('adminAnalysis.overallRate')}</Text>
                <View style={s.rateRow}>
                    <ProgressBar pct={registrationRate} color="#3b82f6" />
                    <Text style={s.rateLabel}>{registrationRate}% {t('adminAnalysis.registered')}</Text>
                </View>
            </View>

            {/* ── Per-Level Breakdown Cards ── */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>{t('adminAnalysis.byLevel')}</Text>
                {(stats.byLevel ?? []).map((lvl, i) => {
                    const rate  = lvl.total > 0 ? Math.round((lvl.finished / lvl.total) * 100) : 0;
                    const color = LEVEL_COLORS[i] ?? '#6b7280';
                    const popPct = Math.round((lvl.total / maxLevelTotal) * 100);

                    return (
                        <View key={lvl.level} style={[s.levelCard, { borderLeftColor: color }]}>
                            {/* header */}
                            <View style={s.levelHeader}>
                                <View style={[s.levelBadge, { backgroundColor: color }]}>
                                    <Text style={s.levelBadgeText}>
                                        {t('adminAnalysis.level')} {lvl.level}
                                    </Text>
                                </View>
                                <Text style={s.levelTotal}>
                                    {lvl.total} {t('adminAnalysis.students')}
                                </Text>
                            </View>

                            {/* population bar */}
                            <View style={s.popBarRow}>
                                <ProgressBar pct={popPct} color={color} />
                            </View>

                            {/* stats row */}
                            <View style={s.levelStatsRow}>
                                <View style={s.levelStat}>
                                    <View style={[s.dot, { backgroundColor: '#10b981' }]} />
                                    <Text style={s.levelStatText}>
                                        {t('adminAnalysis.finished')}: <Text style={s.bold}>{lvl.finished}</Text>
                                    </Text>
                                </View>
                                <View style={s.levelStat}>
                                    <View style={[s.dot, { backgroundColor: '#ef4444' }]} />
                                    <Text style={s.levelStatText}>
                                        {t('adminAnalysis.notFinished')}: <Text style={s.bold}>{lvl.notFinished}</Text>
                                    </Text>
                                </View>
                                <View style={s.levelStat}>
                                    <View style={[s.dot, { backgroundColor: '#8b5cf6' }]} />
                                    <Text style={s.levelStatText}>
                                        {t('adminAnalysis.avgGpa')}: <Text style={s.bold}>{(lvl.avgGpa ?? 0).toFixed(2)}</Text>
                                    </Text>
                                </View>
                            </View>

                            {/* registration rate bar */}
                            <View style={s.rateRow}>
                                <ProgressBar pct={rate} color={color} />
                                <Text style={s.rateLabel}>{rate}%</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* ── Per-Level Summary Table ── */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>{t('adminAnalysis.levelTable')}</Text>
                {/* header row */}
                <View style={[s.tableRow, s.tableHeader]}>
                    <Text style={[s.tableCell, s.tableHeaderText, { flex: 1.2 }]}>{t('adminAnalysis.level')}</Text>
                    <Text style={[s.tableCell, s.tableHeaderText]}>{t('adminAnalysis.totalStudents')}</Text>
                    <Text style={[s.tableCell, s.tableHeaderText]}>{t('adminAnalysis.finished')}</Text>
                    <Text style={[s.tableCell, s.tableHeaderText]}>{t('adminAnalysis.notFinished')}</Text>
                    <Text style={[s.tableCell, s.tableHeaderText]}>{t('adminAnalysis.avgGpa')}</Text>
                    <Text style={[s.tableCell, s.tableHeaderText]}>{t('adminAnalysis.regRate')}</Text>
                </View>
                {(stats.byLevel ?? []).map((lvl, i) => {
                    const rate  = lvl.total > 0 ? Math.round((lvl.finished / lvl.total) * 100) : 0;
                    const color = LEVEL_COLORS[i] ?? '#6b7280';
                    return (
                        <View key={lvl.level} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                            <View style={[s.tableCell, { flex: 1.2 }]}>
                                <View style={[s.levelBadge, { backgroundColor: color }]}>
                                    <Text style={s.levelBadgeText}>{t('adminAnalysis.level')} {lvl.level}</Text>
                                </View>
                            </View>
                            <Text style={[s.tableCell, s.tableCellText]}>{lvl.total}</Text>
                            <View style={s.tableCell}>
                                <View style={[s.chip, { backgroundColor: '#d1fae5' }]}>
                                    <Text style={[s.chipText, { color: '#065f46' }]}>{lvl.finished}</Text>
                                </View>
                            </View>
                            <View style={s.tableCell}>
                                <View style={[s.chip, { backgroundColor: '#fee2e2' }]}>
                                    <Text style={[s.chipText, { color: '#991b1b' }]}>{lvl.notFinished}</Text>
                                </View>
                            </View>
                            <Text style={[s.tableCell, s.tableCellText]}>{(lvl.avgGpa ?? 0).toFixed(2)}</Text>
                            <View style={[s.tableCell, s.rateCell]}>
                                <View style={[bar.track, { flex: 1, marginRight: 4 }]}>
                                    <View style={[bar.fill, { width: `${rate}%` as any, backgroundColor: color }]} />
                                </View>
                                <Text style={s.rateCellText}>{rate}%</Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

/* ── Styles ── */
const s = StyleSheet.create({
    center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
    errorText:   { marginTop: 12, color: '#ef4444', fontSize: 14, textAlign: 'center' },

    container:  { padding: 16, backgroundColor: '#f9fafb' },
    pageTitle:  { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 20 },

    /* summary grid — 2 columns */
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
    summaryCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        borderTopWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    summaryIcon:  { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    summaryLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 4 },
    summaryValue: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6 },
    badge:        { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText:    { fontSize: 12, fontWeight: '700' },

    /* sections */
    section:      { marginTop: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },

    /* rate bar */
    rateRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rateLabel: { fontSize: 13, fontWeight: '700', color: '#374151', minWidth: 48 },

    /* level cards */
    levelCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    levelHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    levelBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    levelBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    levelTotal:     { fontSize: 13, color: '#6b7280' },
    popBarRow:      { marginBottom: 12 },
    levelStatsRow:  { gap: 6, marginBottom: 10 },
    levelStat:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot:            { width: 8, height: 8, borderRadius: 4 },
    levelStatText:  { fontSize: 13, color: '#374151' },
    bold:           { fontWeight: '700' },

    /* table */
    tableRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    tableRowAlt:    { backgroundColor: '#f9fafb' },
    tableHeader:    { backgroundColor: '#f3f4f6', borderRadius: 8, borderBottomWidth: 0, marginBottom: 2 },
    tableHeaderText:{ fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
    tableCell:      { flex: 1, paddingHorizontal: 4, justifyContent: 'center' },
    tableCellText:  { fontSize: 13, color: '#374151', fontWeight: '600' },
    chip:           { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    chipText:       { fontSize: 12, fontWeight: '700' },
    rateCell:       { flex: 1, flexDirection: 'row', alignItems: 'center' },
    rateCellText:   { fontSize: 11, color: '#374151', fontWeight: '600' },
});

export default AdminAnalysis;
