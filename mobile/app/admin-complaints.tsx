import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
    RefreshControl,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../src/context/LanguageContext';
import { useAuth } from '../src/context/AuthContext';
import { getAllComplaints, respondToComplaint, IComplaint } from '../src/services/api';
import CustomHeader from '../src/components/common/CustomHeader';
import ScreenContainer from '../src/components/common/ScreenContainer';

export default function AdminComplaintsScreen() {
    const { t, locale } = useLanguage();
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<IComplaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<IComplaint | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [responseText, setResponseText] = useState('');
    const [responseStatus, setResponseStatus] = useState('under_review');

    const isRTL = locale === 'ar';

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await getAllComplaints();
            setComplaints(data);
        } catch (error) {
            console.error('Error fetching complaints:', error);
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

    const handleRespond = (complaint: IComplaint) => {
        setSelectedComplaint(complaint);
        setResponseText(complaint.adminResponse || '');
        setResponseStatus(complaint.status);
        setModalVisible(true);
    };

    const handleSubmitResponse = async () => {
        if (!selectedComplaint || !responseText.trim()) {
            Alert.alert(t('common.warning'), t('complaints.responseRequired'));
            return;
        }

        try {
            await respondToComplaint(selectedComplaint._id, responseText.trim(), responseStatus);
            Alert.alert(t('common.success'), t('complaints.responseSent'));
            setModalVisible(false);
            setSelectedComplaint(null);
            setResponseText('');
            await fetchComplaints();
        } catch (error) {
            Alert.alert(t('common.error'), t('complaints.responseFailed'));
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'pending': return '#e67e22';
            case 'under_review': return '#2196f3';
            case 'approved': return '#27ae60';
            case 'rejected': return '#c0392b';
            default: return '#666';
        }
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'pending': return t('complaints.statusPending');
            case 'under_review': return t('complaints.statusUnderReview');
            case 'approved': return t('complaints.statusApproved');
            case 'rejected': return t('complaints.statusRejected');
            default: return status;
        }
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <ScreenContainer>
                <CustomHeader title={t('complaints.adminPanelTitle')} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <CustomHeader title={t('complaints.adminPanelTitle')} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {complaints.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="mail-outline" size={64} color="#9ca3af" />
                        <Text style={styles.emptyTitle}>{t('complaints.noComplaintsTitle')}</Text>
                        <Text style={styles.emptyText}>{t('complaints.noComplaintsMessage')}</Text>
                    </View>
                ) : (
                    <View style={styles.complaintsList}>
                        <Text style={styles.complaintsCount}>
                            {t('complaints.complaintsCount', { count: complaints.length })}
                        </Text>
                        {complaints.map((complaint) => (
                            <View key={complaint._id} style={styles.complaintCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.studentInfo}>
                                        <Ionicons name="person-circle" size={24} color="#1a73e8" />
                                        <View style={styles.studentDetails}>
                                            <Text style={styles.studentName}>{complaint.studentName}</Text>
                                            <Text style={styles.studentId}>
                                                {t('complaints.studentIdLabel')}: {complaint.studentId}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(complaint.status) }]}>
                                            {getStatusText(complaint.status)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.requestInfo}>
                                    <Text style={styles.requestType}>{complaint.requestType}</Text>
                                    <Text style={styles.courseName}>{complaint.courseName}</Text>
                                </View>

                                <View style={styles.descriptionContainer}>
                                    <Text style={styles.descriptionLabel}>{t('complaints.problemDescriptionLabel')}:</Text>
                                    <Text style={styles.descriptionText}>{complaint.problemDescription}</Text>
                                    {complaint.additionalDetails ? (
                                        <>
                                            <Text style={styles.descriptionLabel}>{t('complaints.additionalDetailsLabel')}:</Text>
                                            <Text style={styles.descriptionText}>{complaint.additionalDetails}</Text>
                                        </>
                                    ) : null}
                                </View>

                                {complaint.adminResponse && (
                                    <View style={styles.responseContainer}>
                                        <Text style={styles.responseLabel}>
                                            <Ionicons name="mail-unread-outline" size={16} color="#1a73e8" /> {t('complaints.adminResponse')}
                                        </Text>
                                        <Text style={styles.responseText}>{complaint.adminResponse}</Text>
                                        {complaint.reviewedBy && (
                                            <Text style={styles.reviewInfo}>
                                                {t('complaints.reviewedBy')}: {complaint.reviewedBy} | {t('complaints.reviewedAt')} {formatDate(complaint.reviewedAt)}
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <View style={styles.cardFooter}>
                                    <View style={styles.footerItem}>
                                        <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                                        <Text style={styles.footerText}>{formatDate(complaint.createdAt)}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.respondButton}
                                        onPress={() => handleRespond(complaint)}
                                    >
                                        <Ionicons name="chatbubble-outline" size={18} color="#1a73e8" />
                                        <Text style={styles.respondButtonText}>
                                            {complaint.adminResponse ? t('complaints.updateResponse') : t('complaints.respond')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
        </ScrollView>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('complaints.respondToComplaint')}</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {selectedComplaint && (
                            <View style={styles.modalBody}>
                                <View style={styles.complaintSummary}>
                                    <Text style={styles.summaryLabel}>{t('complaints.studentNameLabel')}:</Text>
                                    <Text style={styles.summaryText}>{selectedComplaint.studentName}</Text>
                                    <Text style={styles.summaryLabel}>{t('complaints.requestTypeLabel')}:</Text>
                                    <Text style={styles.summaryText}>{selectedComplaint.requestType}</Text>
                                    <Text style={styles.summaryLabel}>{t('complaints.problemDescriptionLabel')}:</Text>
                                    <Text style={styles.summaryText}>{selectedComplaint.problemDescription}</Text>
                                </View>

                                <Text style={styles.responseStatusLabel}>{t('complaints.responseStatusLabel')}:</Text>
                                <View style={styles.statusPicker}>
                                    {['pending', 'under_review', 'approved', 'rejected'].map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            style={[
                                                styles.statusOption,
                                                responseStatus === status && { backgroundColor: getStatusColor(status) + '20' }
                                            ]}
                                            onPress={() => setResponseStatus(status)}
                                        >
                                            <Text style={[
                                                styles.statusOptionText,
                                                responseStatus === status && { color: getStatusColor(status), fontWeight: 'bold' }
                                            ]}>
                                                {getStatusText(status)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.responseInputLabel}>{t('complaints.responseMessageLabel')}:</Text>
                                <TextInput
                                    style={styles.responseInput}
                                    value={responseText}
                                    onChangeText={setResponseText}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                    placeholder={t('complaints.responseMessagePlaceholder')}
                                    placeholderTextColor="#9ca3af"
                                />

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelModalButton]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.cancelModalButtonText}>{t('common.cancel')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.submitModalButton]}
                                        onPress={handleSubmitResponse}
                                    >
                                        <Text style={styles.submitModalButtonText}>{t('common.save')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
    },
    complaintsList: {
        width: '100%',
    },
    complaintsCount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 16,
    },
    complaintCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    studentDetails: {
        marginLeft: 12,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    studentId: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    requestInfo: {
        marginBottom: 12,
    },
    requestType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a73e8',
        marginBottom: 4,
    },
    courseName: {
        fontSize: 13,
        color: '#6b7280',
    },
    descriptionContainer: {
        marginBottom: 12,
    },
    descriptionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 8,
    },
    responseContainer: {
        backgroundColor: '#f0f4ff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    responseLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a73e8',
        marginBottom: 6,
    },
    responseText: {
        fontSize: 14,
        color: '#1f2937',
        lineHeight: 20,
        marginBottom: 8,
    },
    reviewInfo: {
        fontSize: 11,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        color: '#9ca3af',
        marginLeft: 4,
    },
    respondButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f0f4ff',
    },
    respondButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a73e8',
        marginLeft: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        maxHeight: 500,
    },
    complaintSummary: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#1f2937',
        marginTop: 2,
    },
    responseStatusLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 8,
    },
    statusPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    statusOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        marginRight: 8,
        marginBottom: 8,
    },
    statusOptionText: {
        fontSize: 13,
        color: '#4b5563',
    },
    responseInputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    responseInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#1f2937',
        minHeight: 120,
        backgroundColor: '#f9fafb',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 6,
    },
    cancelModalButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelModalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    submitModalButton: {
        backgroundColor: '#1a73e8',
    },
    submitModalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
