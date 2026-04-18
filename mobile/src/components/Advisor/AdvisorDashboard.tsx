import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAdvisees, getAllStudents } from '../../services/api';
import CustomHeader from '../common/CustomHeader';
import ScreenContainer from '../common/ScreenContainer';

interface Student {
    _id: string;
    studentId: string | number;
    name: string;
    email: string;
    gpa: number;
    completedHours: number;
    level: string;
}

const AdvisorDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t, locale } = useLanguage();
    const isRTL = locale === 'ar';
    const isCoordinator = user?.role === 'academic_guide_coordinator';
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            // Coordinators see all students; guides see only their assigned advisees
            const data = isCoordinator
                ? await getAllStudents()
                : await getAdvisees();
            setStudents(data as unknown as Student[]);
            setFilteredStudents(data as unknown as Student[]);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch students';
            Alert.alert(t('common.error'), message);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStudents();
        setRefreshing(false);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredStudents(students);
            return;
        }

        const queryLower = query.toLowerCase();
        const filtered = students.filter(
            (student) =>
                student.name.toLowerCase().includes(queryLower) ||
                String(student.studentId).toLowerCase().includes(queryLower) ||
                (student.email && student.email.toLowerCase().includes(queryLower))
        );
        setFilteredStudents(filtered);
    };

    if (loading) {
        return (
            <ScreenContainer>
                <CustomHeader title={t('advisor.title')} showBack={false} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                </View>
            </ScreenContainer>
        );
    }

    const totalStudents = students.length;

    return (
        <ScreenContainer>
            <CustomHeader title={t('advisor.title')} showBack={false} />
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
                }
            >
                {/* Total Students */}
                <View style={styles.totalStudentsCard}>
                    <Text style={styles.totalStudentsText}>
                        {t('advisor.totalStudents')}: {totalStudents}
                    </Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('advisor.searchPlaceholder')}
                        value={searchQuery}
                        onChangeText={handleSearch}
                        placeholderTextColor="#9ca3af"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Students List */}
                <Text style={styles.sectionTitle}>
                    {isCoordinator ? t('advisor.allStudents') : t('advisor.myAdvisees')}
                </Text>
                {filteredStudents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>
                            {searchQuery ? t('advisor.noStudentsFound') : t('advisor.noAdvisees')}
                        </Text>
                    </View>
                ) : (
                    filteredStudents.map((student) => (
                        <TouchableOpacity
                            key={student._id}
                            style={styles.studentCard}
                            onPress={() =>
                                router.push({
                                    pathname: '/advisor/student-detail',
                                    params: { studentId: student._id },
                                })
                            }
                        >
                            <View style={styles.studentHeader}>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentId}>{student.studentId}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                            </View>
                            <View style={styles.studentDetails}>
                                <View style={styles.detailItem}>
                                    <Ionicons name="mail-outline" size={16} color="#6b7280" />
                                    <Text style={styles.detailText}>{student.email}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="star-outline" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            GPA: {student.gpa.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="book-outline" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {student.completedHours} {t('advisor.hours')}
                                        </Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="layers-outline" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {t('advisor.level')} {student.level}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    totalStudentsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    totalStudentsText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 16,
        textAlign: 'center',
    },
    studentCard: {
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
    studentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    studentId: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    studentDetails: {
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#4b5563',
    },
});

export default AdvisorDashboard;
