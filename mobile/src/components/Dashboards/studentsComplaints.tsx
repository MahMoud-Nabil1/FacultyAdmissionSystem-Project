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
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../services/api';

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

// Define the AuthUser type based on your context
interface AuthUser {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    studentId?: string;
    // Add any other fields your user object has
}

const StudentComplaintPage: React.FC = () => {
    const { token, user: authUser, logout } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAdditional, setEditAdditional] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');

    // Extract user data safely with proper type checking
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

            const userComplaints = (data || []).filter((c: Complaint) => c.studentId === userData.studentId);
            console.log('User complaints:', userComplaints.length);

            setComplaints(userComplaints);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            Alert.alert('خطأ', 'فشل في تحميل الطلبات');
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
            Alert.alert('تنبيه', 'الرجاء تعبئة جميع الحقول المطلوبة');
            return;
        }

        // Make sure studentId is present
        if (!formData.studentId) {
            Alert.alert('خطأ', 'لم يتم العثور على الرقم الجامعي. الرجاء تسجيل الخروج وإعادة التسجيل');
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
                Alert.alert('نجاح', 'تم تقديم الطلب بنجاح!');
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
                Alert.alert('خطأ', data.message || data.error || 'فشل في تقديم الطلب');
            }
        } catch (err) {
            console.error('Submit error:', err);
            Alert.alert('خطأ', 'فشل في الاتصال بالخادم');
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
                Alert.alert('نجاح', 'تم تحديث الطلب بنجاح');
                await fetchComplaints();
                setEditingId(null);
                setEditDescription('');
                setEditAdditional('');
            } else {
                Alert.alert('خطأ', 'فشل في تحديث الطلب');
            }
        } catch (err) {
            Alert.alert('خطأ', 'فشل في تحديث الطلب');
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
            case 'pending': return '⏳ قيد الانتظار';
            case 'under_review': return '🔍 قيد المراجعة';
            case 'approved': return '✓ تمت الموافقة';
            case 'rejected': return '✗ مرفوض';
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

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>جاري التحميل...</Text>
            </View>
        );
    }

    if (!token || !userData.studentId) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorEmoji}>🔐</Text>
                <Text style={styles.errorTitle}>غير مصرح</Text>
                <Text style={styles.errorText}>الرجاء تسجيل الدخول أولاً</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/(auth)/login')}>
                    <Text style={styles.retryButtonText}>تسجيل الدخول</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🎓 نظام الطلبات الأكاديمية</Text>
                <Text style={styles.welcomeText}>
                    مرحباً, <Text style={styles.boldText}>{userData.name || userData.studentId}</Text> | الرقم الجامعي:{' '}
                    <Text style={styles.boldText}>{userData.studentId}</Text>
                </Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>تسجيل خروج</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'submit' && styles.activeTab]}
                    onPress={() => setActiveTab('submit')}
                >
                    <Text style={[styles.tabText, activeTab === 'submit' && styles.activeTabText]}>
                        📝 تقديم طلب جديد
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'view' && styles.activeTab]}
                    onPress={async () => {
                        setActiveTab('view');
                        await fetchComplaints();
                    }}
                >
                    <Text style={[styles.tabText, activeTab === 'view' && styles.activeTabText]}>
                        📋 طلباتي ({complaints.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'submit' ? (
                <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>تقديم طلب أكاديمي</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>الاسم الكامل *</Text>
                        <View style={styles.disabledInput}>
                            <Text style={styles.disabledText}>{formData.studentName || 'غير متوفر'}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>الرقم الجامعي *</Text>
                        <View style={styles.disabledInput}>
                            <Text style={styles.disabledText}>{formData.studentId}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>نوع الطلب *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="مثال: انسحاب من مادة، تسجيل مادة من سنة أعلى، تعديل جدول"
                            value={formData.requestType}
                            onChangeText={(text) => setFormData({ ...formData, requestType: text })}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>اسم المادة *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="اسم المادة"
                            value={formData.courseName}
                            onChangeText={(text) => setFormData({ ...formData, courseName: text })}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>وصف المشكلة *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="وصف المشكلة بالتفصيل"
                            value={formData.problemDescription}
                            onChangeText={(text) => setFormData({ ...formData, problemDescription: text })}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>تفاصيل إضافية (اختياري)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="تفاصيل إضافية"
                            value={formData.additionalDetails}
                            onChangeText={(text) => setFormData({ ...formData, additionalDetails: text })}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        <Text style={styles.submitButtonText}>
                            {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.complaintsList}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {complaints.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>📭</Text>
                            <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
                            <Text style={styles.emptyText}>لم تقم بتقديم أي طلبات حتى الآن.</Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => setActiveTab('submit')}
                            >
                                <Text style={styles.emptyButtonText}>تقديم طلب</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        complaints.map((complaint) => (
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
                                            placeholder="وصف المشكلة"
                                            placeholderTextColor="#999"
                                        />
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={editAdditional}
                                            onChangeText={setEditAdditional}
                                            multiline
                                            numberOfLines={3}
                                            placeholder="تفاصيل إضافية"
                                            placeholderTextColor="#999"
                                        />
                                        <View style={styles.editButtons}>
                                            <TouchableOpacity
                                                style={[styles.editButton, styles.saveButton]}
                                                onPress={() => handleUpdate(complaint._id, editDescription, editAdditional)}
                                            >
                                                <Text style={styles.buttonText}>حفظ</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.editButton, styles.cancelButton]}
                                                onPress={() => {
                                                    setEditingId(null);
                                                    setEditDescription('');
                                                    setEditAdditional('');
                                                }}
                                            >
                                                <Text style={styles.buttonText}>إلغاء</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.descriptionContainer}>
                                        <Text style={styles.descriptionLabel}>وصف المشكلة:</Text>
                                        <Text style={styles.descriptionText}>{complaint.problemDescription}</Text>
                                        {complaint.additionalDetails && (
                                            <>
                                                <Text style={styles.descriptionLabel}>تفاصيل إضافية:</Text>
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
                                                <Text style={styles.editIconText}>✏️ تعديل</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {complaint.adminResponse && (
                                    <View style={styles.responseContainer}>
                                        <Text style={styles.responseLabel}>📨 رد الإدارة:</Text>
                                        <Text style={styles.responseText}>{complaint.adminResponse}</Text>
                                        {complaint.reviewedBy && (
                                            <Text style={styles.reviewInfo}>
                                                تمت المراجعة بواسطة: {complaint.reviewedBy} في {formatDate(complaint.reviewedAt)}
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <View style={styles.cardFooter}>
                                    <Text style={styles.footerText}>📅 {formatDate(complaint.createdAt)}</Text>
                                    <Text style={styles.footerText}>🆔 {complaint._id.slice(-6)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    errorEmoji: {
        fontSize: 64,
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#c0392b',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    welcomeText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#333',
    },
    logoutButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
    },
    logoutText: {
        color: '#e74c3c',
        fontSize: 14,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#4CAF50',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    formContainer: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    disabledInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f5f5f5',
    },
    disabledText: {
        color: '#666',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    complaintsList: {
        flex: 1,
        padding: 20,
    },
    complaintCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    courseName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    requestType: {
        fontSize: 14,
        color: '#2196f3',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    descriptionContainer: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    descriptionLabel: {
        fontWeight: 'bold',
        marginBottom: 5,
        fontSize: 14,
    },
    descriptionText: {
        marginBottom: 10,
        lineHeight: 20,
    },
    editIconButton: {
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    editIconText: {
        color: '#2196f3',
        fontSize: 12,
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
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#9e9e9e',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    responseContainer: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        borderRightWidth: 4,
        borderRightColor: '#4CAF50',
    },
    responseLabel: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    responseText: {
        marginBottom: 8,
        lineHeight: 20,
    },
    reviewInfo: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
    },
    cardFooter: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 60,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyButton: {
        backgroundColor: '#f39c12',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default StudentComplaintPage;