import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    RefreshControl,
    Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { apiGet, getStudentSchedule, registerStudentToGroup, getAllGroupsForAdvisor, ISubject } from '../../services/api';
import CustomHeader from '../common/CustomHeader';
import ScreenContainer from '../common/ScreenContainer';

interface StudentDetail {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    gpa: number;
    completedHours: number;
    registeredHours: number;
    level: string;
    enrolledSubjects: Array<{
        _id: string;
        code: string;
        name: string;
        creditHours: number;
        grade?: string;
        status: 'enrolled' | 'completed' | 'failed' | 'withdrawn';
    }>;
    academicHistory?: Array<{
        semester: string;
        gpa: number;
        completedHours: number;
        subjects: number;
    }>;
}

const StudentDetail: React.FC = () => {
    const { t, locale } = useLanguage();
    const isRTL = locale === 'ar';
    const { studentId } = useLocalSearchParams();
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [filteredGroups, setFilteredGroups] = useState<any[]>([]);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        if (studentId) {
            fetchStudentDetails();
            fetchStudentSchedule();
        }
    }, [studentId]);

    const fetchStudentDetails = async () => {
        try {
            const response = await apiGet(`/students/${studentId}`);
            setStudent(response.data as unknown as StudentDetail);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch student details';
            Alert.alert(t('common.error'), message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentSchedule = async () => {
        try {
            const data = await getStudentSchedule(studentId as string);
            setSchedule(data as unknown as any[]);
        } catch (error) {
            console.error('Failed to fetch schedule:', error);
        }
    };

    const fetchAvailableGroups = async () => {
        try {
            const data = await getAllGroupsForAdvisor();
            setAvailableGroups(data as unknown as any[]);
        } catch (error) {
            Alert.alert(t('common.error'), t('advisor.fetchGroupsFailed'));
        }
    };

    const handleSelectSubject = (subject: string) => {
        setSelectedSubject(subject);
        const filtered = availableGroups.filter(g => g.subject === subject);
        setFilteredGroups(filtered);
    };

    const handleRegister = async (groupId: string) => {
        try {
            setRegistering(true);
            await registerStudentToGroup(groupId, studentId as string);
            Alert.alert(t('common.success'), t('advisor.registerSuccess'));
            setShowRegisterModal(false);
            setSelectedSubject('');
            setFilteredGroups([]);
            await fetchStudentSchedule();
        } catch (error) {
            const message = error instanceof Error ? error.message : t('advisor.registerFailed');
            Alert.alert(t('common.error'), message);
        } finally {
            setRegistering(false);
        }
    };

    const uniqueSubjects = Array.from(
        new Set(availableGroups.map(g => g.subject))
    );

    const getDayName = (day: string) => {
        const dayNames: Record<string, string> = {
            saturday: t('schedule.days.saturday'),
            sunday: t('schedule.days.sunday'),
            monday: t('schedule.days.monday'),
            tuesday: t('schedule.days.tuesday'),
            wednesday: t('schedule.days.wednesday'),
            thursday: t('schedule.days.thursday'),
            friday: t('schedule.days.friday'),
        };
        return dayNames[day?.toLowerCase()] || day;
    };

    const formatTime = (hour: number) => {
        const h = Math.floor(hour);
        const m = (hour - h) * 60;
        const period = h >= 12 ? t('schedule.pm') : t('schedule.am');
        const displayHour = h > 12 ? h - 12 : h;
        return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchStudentDetails(), fetchStudentSchedule()]);
        setRefreshing(false);
    };

    const getSubjectStatusLabel = (status: string) => {
        return t(`advisor.subjectStatus.${status}`) || status;
    };


    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a73e8" />
            </View>
        );
    }

    if (!student) {
        return (
            <View style={styles.center}>
                <Ionicons name="person-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>{t('advisor.studentNotFound')}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>{t('advisor.goBack')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScreenContainer>
            <CustomHeader
                title={student.name}
                subtitle={student.studentId}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
                }
            >
                {/* Student Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color="#6b7280" />
                        <Text style={styles.infoText}>{student.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="layers-outline" size={20} color="#6b7280" />
                        <Text style={styles.infoText}>
                            Level {student.level}
                        </Text>
                    </View>
                </View>

                {/* Academic Stats */}
                <Text style={styles.sectionTitle}>{t('advisor.academicOverview')}</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="star" size={24} color="#f59e0b" />
                        <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
                            {student.gpa.toFixed(2)}
                        </Text>
                        <Text style={styles.statLabel}>{t('advisor.gpa')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-done" size={24} color="#10b981" />
                        <Text style={[styles.statNumber, { color: '#10b981' }]}>
                            {student.completedHours}
                        </Text>
                        <Text style={styles.statLabel}>{t('advisor.completedHours')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="book" size={24} color="#3b82f6" />
                        <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
                            {student.registeredHours}
                        </Text>
                        <Text style={styles.statLabel}>{t('advisor.registeredHours')}</Text>
                    </View>
                </View>

                {/* Current Enrolled Subjects */}
                {student.enrolledSubjects && student.enrolledSubjects.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>{t('advisor.currentSubjects')}</Text>
                        {student.enrolledSubjects.map((subject) => (
                            <View key={subject._id} style={styles.subjectCard}>
                                <View style={styles.subjectHeader}>
                                    <View style={styles.subjectInfo}>
                                        <Text style={styles.subjectCode}>{subject.code}</Text>
                                        <Text style={styles.subjectName}>{subject.name}</Text>
                                    </View>
                                    
                                </View>
                                <View style={styles.subjectDetails}>
                                    <Text style={styles.subjectDetail}>
                                        {subject.creditHours} {t('advisor.creditHours')}
                                    </Text>
                                    {subject.grade && (
                                        <Text style={styles.subjectDetail}>
                                            {t('advisor.grade')}: {subject.grade}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Student Schedule */}
                <Text style={styles.sectionTitle}>{t('advisor.studentSchedule')}</Text>
                {schedule.length === 0 ? (
                    <View style={styles.emptyScheduleCard}>
                        <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
                        <Text style={styles.emptyScheduleText}>{t('advisor.noSchedule')}</Text>
                    </View>
                ) : (
                    schedule.map((group) => {
                        return (
                            <View key={group._id} style={styles.scheduleCard}>
                                <View style={styles.scheduleHeader}>
                                    <View>
                                        <Text style={styles.scheduleSubject}>
                                            {group.subject || 'N/A'}
                                        </Text>
                                        <Text style={styles.scheduleGroup}>
                                            Group #{group.number}
                                        </Text>
                                    </View>
                                    <View style={styles.scheduleBadge}>
                                        <Text style={styles.scheduleBadgeText}>
                                            {t(`schedule.type.${group.type}`) || group.type}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.scheduleDetails}>
                                    <View style={styles.scheduleDetailItem}>
                                        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                        <Text style={styles.scheduleDetailText}>
                                            {getDayName(group.day)}
                                        </Text>
                                    </View>
                                    <View style={styles.scheduleDetailItem}>
                                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                                        <Text style={styles.scheduleDetailText}>
                                            {formatTime(group.from)} - {formatTime(group.to)}
                                        </Text>
                                    </View>
                                    {group.place?.name && (
                                        <View style={styles.scheduleDetailItem}>
                                            <Ionicons name="location-outline" size={16} color="#6b7280" />
                                            <Text style={styles.scheduleDetailText}>
                                                {group.place.name}
                                                {group.place.building ? ` - ${group.place.building}` : ''}
                                                {group.place.room ? ` ${group.place.room}` : ''}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}

                {/* Register Button */}
                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => {
                        fetchAvailableGroups();
                        setShowRegisterModal(true);
                    }}
                >
                    <Ionicons name="add-circle" size={24} color="#1a73e8" />
                    <Text style={styles.registerButtonText}>{t('advisor.registerSubject')}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Registration Modal */}
            <Modal
                visible={showRegisterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRegisterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('advisor.registerSubject')}</Text>
                            <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {!selectedSubject ? (
                            <>
                                <Text style={styles.modalSubtitle}>{t('advisor.selectSubject')}</Text>
                                <ScrollView style={styles.subjectList}>
                                    {uniqueSubjects.map((subject) => {
                                        const subjectGroups = availableGroups.filter(g => g.subject === subject);
                                        return (
                                            <TouchableOpacity
                                                key={subject}
                                                style={styles.subjectItem}
                                                onPress={() => handleSelectSubject(subject)}
                                            >
                                                <Text style={styles.subjectItemText}>{subject}</Text>
                                                <Text style={styles.subjectItemGroups}>
                                                    {subjectGroups.length} {t('advisor.availableGroups')}
                                                </Text>
                                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                <View style={styles.selectedSubjectHeader}>
                                    <TouchableOpacity onPress={() => {
                                        setSelectedSubject('');
                                        setFilteredGroups([]);
                                    }}>
                                        <Ionicons name="chevron-back" size={20} color="#1a73e8" />
                                    </TouchableOpacity>
                                    <Text style={styles.selectedSubjectText}>{selectedSubject}</Text>
                                </View>
                                <ScrollView style={styles.groupList}>
                                    {filteredGroups.map((group) => {
                                        const isFull = group.students && group.students.length >= group.capacity;
                                        return (
                                            <View key={group._id} style={styles.groupCard}>
                                                <View style={styles.groupCardHeader}>
                                                    <Text style={styles.groupCardTitle}>
                                                        Group #{group.number}
                                                    </Text>
                                                    <Text style={[
                                                        styles.groupCardType,
                                                        { backgroundColor: isFull ? '#fee2e2' : '#e0e7ff' }
                                                    ]}>
                                                        {t(`schedule.type.${group.type}`) || group.type}
                                                    </Text>
                                                </View>
                                                <View style={styles.groupCardDetails}>
                                                    <Text style={styles.groupCardDetail}>
                                                        {getDayName(group.day)}
                                                    </Text>
                                                    <Text style={styles.groupCardDetail}>
                                                        {formatTime(group.from)} - {formatTime(group.to)}
                                                    </Text>
                                                    {group.place?.name && (
                                                        <Text style={styles.groupCardDetail}>
                                                            {group.place.name}
                                                        </Text>
                                                    )}
                                                    <Text style={styles.groupCardDetail}>
                                                        {group.students?.length || 0}/{group.capacity} {t('advisor.seats')}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.registerGroupButton,
                                                        isFull && styles.disabledButton
                                                    ]}
                                                    onPress={() => !isFull && handleRegister(group._id)}
                                                    disabled={isFull || registering}
                                                >
                                                    <Text style={[
                                                        styles.registerGroupButtonText,
                                                        isFull && styles.disabledButtonText
                                                    ]}>
                                                        {isFull ? t('advisor.groupFull') : t('advisor.register')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#9ca3af',
        marginTop: 16,
        marginBottom: 20,
    },
    header: {
        backgroundColor: '#ffffff',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButtonHeader: {
        padding: 8,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontSize: 15,
        color: '#4b5563',
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center',
    },
    subjectCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectCode: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a73e8',
    },
    subjectName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 4,
    },
    subjectStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    subjectStatusText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    subjectDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    subjectDetail: {
        fontSize: 14,
        color: '#6b7280',
    },
    semesterCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    semesterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    semesterName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    semesterGpa: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f59e0b',
    },
    semesterDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    semesterDetail: {
        fontSize: 14,
        color: '#6b7280',
    },
    actionsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        backgroundColor: '#f0f4ff',
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a73e8',
    },
    backButton: {
        backgroundColor: '#1a73e8',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    scheduleCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    scheduleSubject: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    scheduleGroup: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    scheduleBadge: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    scheduleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a73e8',
    },
    scheduleDetails: {
        gap: 8,
    },
    scheduleDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    scheduleDetailText: {
        fontSize: 14,
        color: '#4b5563',
    },
    emptyScheduleCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    emptyScheduleText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 12,
        textAlign: 'center',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a73e8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        padding: 16,
    },
    subjectList: {
        maxHeight: 400,
    },
    subjectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    subjectItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    subjectItemGroups: {
        fontSize: 12,
        color: '#6b7280',
        marginRight: 8,
    },
    selectedSubjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    selectedSubjectText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    groupList: {
        maxHeight: 500,
    },
    groupCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        marginBottom: 0,
    },
    groupCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    groupCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    groupCardType: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '600',
    },
    groupCardDetails: {
        gap: 6,
        marginBottom: 12,
    },
    groupCardDetail: {
        fontSize: 14,
        color: '#6b7280',
    },
    registerGroupButton: {
        backgroundColor: '#1a73e8',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#d1d5db',
    },
    registerGroupButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    disabledButtonText: {
        color: '#9ca3af',
    },
});

export default StudentDetail;
