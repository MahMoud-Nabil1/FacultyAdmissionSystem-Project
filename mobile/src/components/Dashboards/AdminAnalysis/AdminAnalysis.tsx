import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRegistrationStats } from '../../../services/api';

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
            .then((data: any) => {
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
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#004a99" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Registration Stats</Text>


            <View style={styles.grid}>


                <View style={styles.card}>
                    <View style={[styles.iconWrapper, styles.iconPrimary]}>
                        <Ionicons name="people-outline" size={24} color="#004a99" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Total Students</Text>
                        <Text style={styles.value}>{totalStudents.toLocaleString()}</Text>
                    </View>
                </View>


                <View style={styles.card}>
                    <View style={[styles.iconWrapper, styles.iconSuccess]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Finished Registration</Text>
                        <Text style={styles.value}>{finishedRegistration.toLocaleString()}</Text>
                    </View>
                </View>


                <View style={styles.card}>
                    <View style={[styles.iconWrapper, styles.iconError]}>
                        <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Did Not Finish</Text>
                        <Text style={styles.value}>{didNotFinishRegistration.toLocaleString()}</Text>
                    </View>
                </View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 16,
        backgroundColor: '#f9fafb',
        minHeight: '100%',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    grid: {
        flexDirection: 'column',
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 16,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    iconPrimary: {
        backgroundColor: '#eef6ff',
    },
    iconSuccess: {
        backgroundColor: '#ecfdf5',
    },
    iconError: {
        backgroundColor: '#fef2f2',
    },
    textContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
});

export default AdminAnalysis;
