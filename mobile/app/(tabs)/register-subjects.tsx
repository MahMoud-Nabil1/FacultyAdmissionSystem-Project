import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { getEligibleSubjects, getAllGroups, apiPost, ISubject } from '../../src/services/api';
import { IGroup } from '../../src/components/Dashboards/Groups';

export default function RegisterSubjects() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const [eligibleSubjects, setEligibleSubjects] = useState<ISubject[]>([]);
    const [groups, setGroups] = useState<IGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [subjects, allGroups] = await Promise.all([
                    getEligibleSubjects(),
                    getAllGroups(),
                ]);
                setEligibleSubjects(subjects);
                setGroups(allGroups);
            } catch (err: any) {
                Alert.alert(t('common.error'), err.message || t('registerSubjects.fetchFailed'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, t]);

    const handleRequestGroup = async (groupId: string) => {
        setActionLoading(true);
        try {
            const { res, data } = await apiPost(`/groups/${groupId}/request`, {});
            if (!res.ok) {
                throw new Error((data as any).error || t('registerSubjects.requestFailed'));
            }
            Alert.alert(t('common.success'), t('registerSubjects.requestSuccess'));
            router.back();
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const getGroupsForSubject = (subjectCode: string) => {
        return groups.filter(g => g.subject.toLowerCase() === subjectCode.toLowerCase());
    };

    const formatSubjectCode = (code: string) => {
        const m = code.match(/([a-zA-Z]+)(\d+)/);
        if (m) return `${m[1].toUpperCase()} ${m[2]}`;
        return code.toUpperCase();
    };

    const renderSubjectCard = ({ item: subject }: { item: ISubject }) => {
        const subjectGroups = getGroupsForSubject(subject.code);
        const isSelected = selectedSubject === subject._id;

        return (
            <View style={[styles.subjectCard, isSelected && styles.subjectCardSelected]}>
                <TouchableOpacity
                    style={styles.subjectHeader}
                    onPress={() => setSelectedSubject(isSelected ? null : subject._id)}
                >
                    <View style={styles.subjectInfo}>
                        <Text style={styles.subjectCode}>{formatSubjectCode(subject.code)}</Text>
                        <Text style={styles.subjectName}>{subject.name}</Text>
                        <Text style={styles.subjectCredits}>
                            {subject.creditHours} {t('registerSubjects.creditHours')}
                        </Text>
                    </View>
                    <Ionicons
                        name={isSelected ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color="#1a73e8"
                    />
                </TouchableOpacity>

                {isSelected && subjectGroups.length > 0 && (
                    <View style={styles.groupsContainer}>
                        {subjectGroups.map((group) => (
                            <View key={group._id} style={styles.groupItem}>
                                <View style={styles.groupInfo}>
                                    <Text style={styles.groupNumber}>
                                        {t('registerSubjects.group')} {group.number}
                                    </Text>
                                    <Text style={styles.groupType}>
                                        {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                                    </Text>
                                    <Text style={styles.groupDay}>
                                        {group.day.charAt(0).toUpperCase() + group.day.slice(1)}
                                    </Text>
                                    <Text style={styles.groupTime}>
                                        {String(group.from).padStart(2, '0')}:00 – {String(group.to).padStart(2, '0')}:00
                                    </Text>
                                    {group.place && (
                                        <Text style={styles.groupPlace}>
                                            <Ionicons name="location-outline" size={12} color="#6b7280" /> {group.place}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.requestButton,
                                        group.students.length >= group.capacity && styles.requestButtonDisabled,
                                    ]}
                                    disabled={group.students.length >= group.capacity || actionLoading}
                                    onPress={() => handleRequestGroup(group._id)}
                                >
                                    <Text style={styles.requestButtonText}>
                                        {group.students.length >= group.capacity
                                            ? t('registerSubjects.full')
                                            : t('registerSubjects.request')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {isSelected && subjectGroups.length === 0 && (
                    <Text style={styles.noGroupsText}>
                        {t('registerSubjects.noGroupsAvailable')}
                    </Text>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-forward" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('registerSubjects.title')}</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {eligibleSubjects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="book-outline" size={72} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>{t('registerSubjects.noEligibleSubjects')}</Text>
                        <Text style={styles.emptySubtitle}>
                            {t('registerSubjects.noEligibleSubjectsSubtitle')}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={eligibleSubjects}
                        renderItem={renderSubjectCard}
                        keyExtractor={(item) => item._id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </ScrollView>
        </View>
    );
}

const BRAND_BLUE = '#004a99';
const BRAND_LIGHT_BG = '#eef6ff';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BRAND_LIGHT_BG },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: BRAND_BLUE,
        paddingTop: 50,
        paddingBottom: 18,
        paddingHorizontal: 20,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    scroll: { padding: 20, paddingBottom: 40 },
    listContainer: { paddingBottom: 20 },
    subjectCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderLeftWidth: 4,
        borderLeftColor: BRAND_BLUE,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    subjectCardSelected: {
        borderLeftColor: '#10b981',
    },
    subjectHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subjectInfo: { flex: 1 },
    subjectCode: { fontSize: 16, fontWeight: '700', color: '#1f2937', textAlign: 'right' },
    subjectName: { fontSize: 14, color: '#6b7280', textAlign: 'right', marginTop: 4 },
    subjectCredits: { fontSize: 12, color: BRAND_BLUE, fontWeight: '600', textAlign: 'right', marginTop: 4 },
    groupsContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    groupItem: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    groupInfo: { flex: 1 },
    groupNumber: { fontSize: 14, fontWeight: '600', color: '#1f2937', textAlign: 'right' },
    groupType: { fontSize: 12, color: '#6b7280', textAlign: 'right', marginTop: 2 },
    groupDay: { fontSize: 12, color: '#6b7280', textAlign: 'right', marginTop: 2 },
    groupTime: { fontSize: 12, color: BRAND_BLUE, fontWeight: '500', textAlign: 'right', marginTop: 2 },
    groupPlace: { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 2 },
    requestButton: {
        backgroundColor: BRAND_BLUE,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 12,
    },
    requestButtonDisabled: {
        backgroundColor: '#d1d5db',
    },
    requestButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    noGroupsText: {
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 14,
        marginTop: 12,
    },
    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#4b5563', marginTop: 10 },
    emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 5 },
});
