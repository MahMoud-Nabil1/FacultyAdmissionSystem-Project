import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Registration Stats</Text>

            {/* Stacked Layout optimized for Mobile */}
            <View style={styles.grid}>

                {/* Total Students Card */}
                <View style={styles.card}>
                    <View style={[styles.iconWrapper, styles.iconPrimary]}>
                        <Ionicons name="people-outline" size={24} color="#004a99" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Total Students</Text>
                        <Text style={styles.value}>{totalStudents.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Finished Registration Card */}
                <View style={styles.card}>
                    <View style={[styles.iconWrapper, styles.iconSuccess]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>Finished Registration</Text>
                        <Text style={styles.value}>{finishedRegistration.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Did Not Finish Registration Card */}
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
        backgroundColor: '#f9fafb', // var(--color-bg)
        minHeight: '100%',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827', // var(--color-text)
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
        backgroundColor: '#ffffff', // var(--color-surface)
        borderWidth: 1,
        borderColor: '#e2e8f0', // var(--color-border)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 16, // fallback for gap in older RN versions
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
        backgroundColor: '#eef6ff', // var(--color-primary-light)
    },
    iconSuccess: {
        backgroundColor: '#ecfdf5', // var(--color-success-bg)
    },
    iconError: {
        backgroundColor: '#fef2f2', // var(--color-error-bg)
    },
    textContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280', // var(--color-text-muted)
        marginBottom: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827', // var(--color-text)
    },
});

export default AdminAnalysis;
