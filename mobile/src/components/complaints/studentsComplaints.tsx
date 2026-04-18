import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import CustomHeader from '../common/CustomHeader';
import ScreenContainer from '../common/ScreenContainer';

interface Complaint {
    _id: string;
    studentName: string;
    studentId: string;
    requestType: string;
    courseName: string;
    problemDescription: string;
    additionalDetails: string;
    status: string;
    adminResponse: string;
    reviewedBy: string;
    reviewedAt: string;
    createdAt: string;
}

interface AuthUser {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    studentId?: string;
}

const StudentComplaintPage: React.FC = () => {
    const { token, user: authUser, logout } = useAuth();
    const { t, locale } = useLanguage();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAdditional, setEditAdditional] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');

    const align = locale === 'ar' ? 'right' : 'left';

    // Extract user data safely
    const userData = {
        name: (authUser as any)?.name || (authUser as any)?.fullName || '',
        studentId: (authUser as any)?.studentId || (authUser as any)?.id || (authUser as any)?._id || '',
        role: (authUser as any)?.role || 'student'
    };

    const [formData, setFormData] = useState({
        studentName: userData.name,
        studentId: userData.studentId,
        requestType: '',
        courseName: '',
        problemDescription: '',
        additionalDetails: ''
    });

    // Update form when userData changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            studentName: userData.name,
            studentId: userData.studentId
        }));
    }, [authUser]);

    useEffect(() => {
        const init = async () => {
            if (!token) {
                router.replace('/(auth)/login');
                return;
            }

            if (userData.studentId) {
                await fetchComplaints();
            } else {
                console.log('Waiting for user data:', authUser);
                setLoading(false);
            }
        };

        init();
    }, [token, authUser]);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            console.log('Fetching complaints for studentId:', userData.studentId);

            const response = await fetch(`${API_BASE}/complaints`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Fetch error:', response.status, errorText);
                throw new Error(`Failed to fetch complaints: ${response.status}`);
            }

            const data = await response.json();
            console.log('All complaints:', data?.length || 0);

            const userComplaints = (data || []).filter((c: Complaint) => String(c.studentId) === String(userData.studentId));
            console.log('User complaints:', userComplaints.length);

            setComplaints(userComplaints);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            Alert.alert(t('common.error'), t('complaints.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchComplaints();
        setRefreshing(false);
    };

    const handleSubmit = async () => {
        if (!formData.requestType || !formData.courseName || !formData.problemDescription) {
            Alert.alert(t('common.warning'), t('complaints.fillRequired'));
            return;
        }

        if (!formData.studentId) {
            Alert.alert(t('common.error'), t('complaints.studentIdMissing'));
            return;
        }

        setSubmitting(true);

        const complaintData = {
            studentName: formData.studentName,
            studentId: formData.studentId,
            requestType: formData.requestType,
            courseName: formData.courseName,
            problemDescription: formData.problemDescription,
            additionalDetails: formData.additionalDetails || '',
            status: 'pending'
        };

        console.log('Submitting complaint:', complaintData);

        try {
            const response = await fetch(`${API_BASE}/complaints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(complaintData)
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(t('common.success'), t('complaints.submittedSuccessfully'));
                setFormData({
                    ...formData,
                    requestType: '',
                    courseName: '',
                    problemDescription: '',
                    additionalDetails: ''
                });
                await fetchComplaints();
                setActiveTab('view');
            } else {
                console.error('Submit error:', data);
                Alert.alert(t('common.error'), data.message || data.error || t('complaints.submitFailed'));
            }
        } catch (err) {
            console.error('Submit error:', err);
            Alert.alert(t('common.error'), t('complaints.networkError'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (id: string, description: string, additional: string) => {
        try {
            const response = await fetch(`${API_BASE}/complaints/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    problemDescription: description,
                    additionalDetails: additional
                })
            });

            if (response.ok) {
                Alert.alert(t('common.success'), t('complaints.updatedSuccessfully'));
                await fetchComplaints();
                setEditingId(null);
                setEditDescription('');
                setEditAdditional('');
            } else {
                Alert.alert(t('common.error'), t('complaints.updateFailed'));
            }
        } catch (err) {
            Alert.alert(t('common.error'), t('complaints.updateFailed'));
        }
    };

    const getStatusColor = (status: string): string => {
        switch(status) {
            case 'pending': return '#e67e22';
            case 'under_review': return '#2196f3';
            case 'approved': return '#27ae60';
            case 'rejected': return '#c0392b';
            default: return '#666';
        }
    };

    const getStatusText = (status: string): string => {
        switch(status) {
            case 'pending': return t('complaints.statusPending');
            case 'under_review': return t('complaints.statusUnderReview');
            case 'approved': return t('complaints.statusApproved');
            case 'rejected': return t('complaints.statusRejected');
            default: return status;
        }
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    if (!token) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="lock-closed-outline" size={64} color="#c0392b" />
                <Text style={styles.errorTitle}>{t('complaints.unauthorizedTitle')}</Text>
                <Text style={styles.errorText}>{t('complaints.unauthorizedMessage')}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.retryButtonText}>{t('complaints.loginButton')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScreenContainer>
            <CustomHeader
                title={t('complaints.appTitle')}
                subtitle={`${userData.name || userData.studentId}`}
            />

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'submit' && styles.activeTab]}
                    onPress={() => setActiveTab('submit')}
                >
                    <Ionicons 
                        name={activeTab === 'submit' ? "create" : "create-outline"} 
                        size={20} 
                        color={activeTab === 'submit' ? '#1a73e8' : '#6b7280'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'submit' && styles.activeTabText]}>
                        {t('complaints.newRequestTab')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'view' && styles.activeTab]}
                    onPress={async () => {
                        setActiveTab('view');
                        await fetchComplaints();
                    }}
                >
                    <Ionicons 
                        name={activeTab === 'view' ? "list" : "list-outline"} 
                        size={20} 
                        color={activeTab === 'view' ? '#1a73e8' : '#6b7280'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'view' && styles.activeTabText]}>
                        {t('complaints.myRequestsTab')} ({complaints.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'submit' ? (
                <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 20 }}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="create-outline" size={22} color="#004a99" />
                        <Text style={styles.sectionTitle}>{t('complaints.submitTitle')}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('complaints.fullNameLabel')} *</Text>
                        <View style={styles.disabledInput}>
                            <Text style={styles.disabledText}>{formData.studentName || t('complaints.notAvailable')}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('complaints.studentIdLabel')} *</Text>
                        <View style={styles.disabledInput}>
                            <Text style={styles.disabledText}>{formData.studentId}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('complaints.requestTypeLabel')} *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('complaints.requestTypePlaceholder')}
                            value={formData.requestType}
                            onChangeText={(text) => setFormData({ ...formData, requestType: text })}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('complaints.courseNameLabel')} *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('complaints.courseNamePlaceholder')}
                            value={formData.courseName}
                            onChangeText={(text) => setFormData({ ...formData, courseName: text })}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('complaints.problemDescriptionLabel')} *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('complaints.problemDescriptionPlaceholder')}
                            value={formData.problemDescription}
                            onChangeText={(text) => setFormData({ ...formData, problemDescription: text })}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('complaints.additionalDetailsLabel')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('complaints.additionalDetailsPlaceholder')}
                            value={formData.additionalDetails}
                            onChangeText={(text) => setFormData({ ...formData, additionalDetails: text })}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        <Text style={styles.submitButtonText}>
                            {submitting ? t('common.sending') : t('complaints.submitButton')}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.complaintsList}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {complaints.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="mail-outline" size={64} color="#9ca3af" />
                            <Text style={styles.emptyTitle}>{t('complaints.noRequestsTitle')}</Text>
                            <Text style={styles.emptyText}>{t('complaints.noRequestsMessage')}</Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => setActiveTab('submit')}
                            >
                                <Text style={styles.emptyButtonText}>{t('complaints.submitRequestButton')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="list-outline" size={22} color="#004a99" />
                                <Text style={styles.sectionTitle}>{t('complaints.myRequestsTab')}</Text>
                            </View>
                            {complaints.map((complaint) => (
                            <View key={complaint._id} style={styles.complaintCard}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.courseName}>{complaint.courseName}</Text>
                                        <Text style={styles.requestType}>{complaint.requestType}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(complaint.status) }]}>
                                            {getStatusText(complaint.status)}
                                        </Text>
                                    </View>
                                </View>

                                {editingId === complaint._id ? (
                                    <View style={styles.editContainer}>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={editDescription}
                                            onChangeText={setEditDescription}
                                            multiline
                                            numberOfLines={4}
                                            placeholder={t('complaints.problemDescriptionPlaceholder')}
                                            placeholderTextColor="#9ca3af"
                                        />
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={editAdditional}
                                            onChangeText={setEditAdditional}
                                            multiline
                                            numberOfLines={3}
                                            placeholder={t('complaints.additionalDetailsPlaceholder')}
                                            placeholderTextColor="#9ca3af"
                                        />
                                        <View style={styles.editButtons}>
                                            <TouchableOpacity
                                                style={[styles.editButton, styles.saveButton]}
                                                onPress={() => handleUpdate(complaint._id, editDescription, editAdditional)}
                                            >
                                                <Text style={styles.buttonText}>{t('common.save')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.editButton, styles.cancelButton]}
                                                onPress={() => {
                                                    setEditingId(null);
                                                    setEditDescription('');
                                                    setEditAdditional('');
                                                }}
                                            >
                                                <Text style={styles.buttonText}>{t('common.cancel')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.descriptionContainer}>
                                        <Text style={styles.descriptionLabel}>{t('complaints.problemDescriptionLabel')}:</Text>
                                        <Text style={styles.descriptionText}>{complaint.problemDescription}</Text>
                                        {complaint.additionalDetails && (
                                            <>
                                                <Text style={styles.descriptionLabel}>{t('complaints.additionalDetailsLabel')}:</Text>
                                                <Text style={styles.descriptionText}>{complaint.additionalDetails}</Text>
                                            </>
                                        )}
                                        {complaint.status === 'pending' && (
                                            <TouchableOpacity
                                                style={styles.editIconButton}
                                                onPress={() => {
                                                    setEditingId(complaint._id);
                                                    setEditDescription(complaint.problemDescription);
                                                    setEditAdditional(complaint.additionalDetails || '');
                                                }}
                                            >
                                                <Ionicons name="create-outline" size={16} color="#1a73e8" />
                                                <Text style={styles.editIconText}>{t('common.edit')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {complaint.adminResponse && (
                                    <View style={styles.responseContainer}>
                                        <Text style={styles.responseLabel}>
                                            <Ionicons name="mail-unread-outline" size={16} color="#1a73e8" /> {t('complaints.adminResponse')}
                                        </Text>
                                        <Text style={styles.responseText}>{complaint.adminResponse}</Text>
                                        {complaint.reviewedBy && (
                                            <Text style={styles.reviewInfo}>
                                                {t('complaints.reviewedBy')}: {complaint.reviewedBy} {t('complaints.reviewedAt')} {formatDate(complaint.reviewedAt)}
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <View style={styles.cardFooter}>
                                    <View style={styles.footerItem}>
                                        <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                                        <Text style={styles.footerText}>{formatDate(complaint.createdAt)}</Text>
                                    </View>
                                    <View style={styles.footerItem}>
                                        <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
                                        <Text style={styles.footerText}>{complaint._id.slice(-6)}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                        </>
                    )}
                </ScrollView>
            )}
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6b7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eef6ff',
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#c0392b',
    },
    errorText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#004a99',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        gap: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#1a73e8',
    },
    tabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#1a73e8',
        fontWeight: 'bold',
    },
    formContainer: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1f2937',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    disabledInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#f3f4f6',
    },
    disabledText: {
        color: '#6b7280',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#1a73e8',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    disabledButton: {
        backgroundColor: '#d1d5db',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    complaintsList: {
        flex: 1,
    },
    complaintCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#1a73e8',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    courseName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    requestType: {
        fontSize: 14,
        color: '#1a73e8',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    descriptionContainer: {
        backgroundColor: '#f9fafb',
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
    },
    descriptionLabel: {
        fontWeight: '600',
        marginBottom: 6,
        fontSize: 14,
        color: '#374151',
    },
    descriptionText: {
        marginBottom: 10,
        lineHeight: 22,
        color: '#4b5563',
    },
    editIconButton: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
    },
    editIconText: {
        color: '#1a73e8',
        fontSize: 14,
        fontWeight: '500',
    },
    editContainer: {
        marginBottom: 15,
    },
    editButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    editButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#1a73e8',
    },
    cancelButton: {
        backgroundColor: '#9ca3af',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    responseContainer: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#1a73e8',
    },
    responseLabel: {
        fontWeight: 'bold',
        marginBottom: 8,
        fontSize: 14,
        color: '#1f2937',
    },
    responseText: {
        marginBottom: 8,
        lineHeight: 22,
        color: '#4b5563',
    },
    reviewInfo: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
    },
    cardFooter: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    footerText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 60,
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1f2937',
    },
    emptyText: {
        color: '#6b7280',
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 14,
    },
    emptyButton: {
        backgroundColor: '#1a73e8',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default StudentComplaintPage;