
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
    Keyboard,
    ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface StudentData {
    id?: string;
    name?: string;
    email?: string | null;
    role?: string;
    studentId?: string;
    gpa?: number;
    department?: string;
    level?: string;
    registeredHours?: number;
    completedHours?: number;
    completedSubjects?: string[];
    registeredSubjects?: string[];
}

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const AiChatBox: React.FC = () => {
    const { user, isAuthenticated, token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    const { width, height } = Dimensions.get('window');

    // Get student data from user object
    const getStudentData = (): StudentData => {
        return {
            id: user?.id || user?._id,
            name: user?.name,
            email: user?.email,
            role: user?.role,
            studentId: user?.studentId?.toString(),
            gpa: user?.gpa,
            department: user?.department,
            level: user?.level,
            registeredHours: user?.registeredHours,
            completedHours: user?.completedHours,
            completedSubjects: user?.completedSubjects,
            registeredSubjects: user?.registeredSubjects
        };
    };

    // Build system prompt from student data
    const buildSystemPrompt = (data: StudentData): string => {
        return `أنت مساعد ذكي لنظام القبول الجامعي. تحدث دائماً باللغة العربية بأسلوب ودود ومهني.

معلومات الطالب الحالي:
- الاسم: ${data.name || 'غير محدد'}
- الرقم الجامعي: ${data.studentId || 'غير محدد'}
- البريد الإلكتروني: ${data.email || 'غير محدد'}
- القسم: ${data.department || 'غير محدد'}
- المستوى الدراسي: ${data.level || 'غير محدد'}
- المعدل التراكمي (GPA): ${data.gpa ?? 'غير محدد'}
- الساعات المسجلة: ${data.registeredHours ?? 'غير محدد'}
- الساعات المكتملة: ${data.completedHours ?? 'غير محدد'}
- المواد المسجلة: ${data.registeredSubjects?.join(', ') || 'لا توجد مواد مسجلة'}
- المواد المكتملة: ${data.completedSubjects?.join(', ') || 'لا توجد مواد مكتملة'}

يمكنك مساعدة الطالب في:
- الاستفسار عن معلوماته الشخصية والأكاديمية
- تسجيل المواد والجدول الدراسي
- تقديم الشكاوى والطلبات
- أي سؤال يتعلق بالنظام الأكاديمي

كن مختصراً ومفيداً في إجاباتك.`;
    };

    // Get user ID
    const getUserId = () => {
        return user?.id || user?._id || user?.studentId?.toString() || null;
    };

    // Get storage key
    const getStorageKey = () => {
        const userId = getUserId();
        if (userId) {
            return `aiChatMessages_${userId}`;
        }
        return null;
    };

    // Load messages from AsyncStorage
    const loadMessages = async () => {
        if (isAuthenticated && getUserId()) {
            try {
                const storageKey = getStorageKey();
                if (storageKey) {
                    const savedMessages = await AsyncStorage.getItem(storageKey);
                    if (savedMessages) {
                        const parsedMessages = JSON.parse(savedMessages);
                        const messagesWithDates = parsedMessages.map((msg: any) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp)
                        }));
                        setMessages(messagesWithDates);
                    } else {
                        await setDefaultMessages();
                    }
                }
            } catch (error) {
                console.error('Error loading messages:', error);
                await setDefaultMessages();
            }
        } else {
            setMessages([]);
        }
    };

    // Save messages to AsyncStorage
    const saveMessages = async () => {
        if (isAuthenticated && getUserId() && messages.length > 0) {
            const storageKey = getStorageKey();
            if (storageKey) {
                await AsyncStorage.setItem(storageKey, JSON.stringify(messages));
            }
        }
    };

    useEffect(() => {
        const init = async () => {
            await loadMessages();
        };
        init();
    }, [user, isAuthenticated]);

    useEffect(() => {
        const save = async () => {
            await saveMessages();
        };
        save();
    }, [messages, isAuthenticated]);

    const setDefaultMessages = async () => {
        const defaultMessages: Message[] = [
            {
                id: '1',
                text: 'مرحباً! أنا المساعد الذكي. كيف يمكنني مساعدتك؟',
                sender: 'ai',
                timestamp: new Date()
            }
        ];
        setMessages(defaultMessages);
        if (isAuthenticated && getUserId()) {
            const storageKey = getStorageKey();
            if (storageKey) {
                await AsyncStorage.setItem(storageKey, JSON.stringify(defaultMessages));
            }
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        Keyboard.dismiss();

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        const sentMessage = inputMessage;
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputMessage('');
        setIsLoading(true);

        const studentData = getStudentData();
        const systemPrompt = buildSystemPrompt(studentData);

        try {
            // Build OpenAI-format message history for Groq
            const chatHistory = updatedMessages
                .filter(m => m.id !== '1')
                .map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }));

            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...chatHistory,
                        { role: 'user', content: sentMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.error('❌ Groq API failed:', response.status, JSON.stringify(errBody));
                throw new Error(`Groq error ${response.status}: ${errBody?.error?.message || 'Unknown'}`);
            }

            const data = await response.json();
            const aiText = data?.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من الرد. حاول مرة أخرى.';

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: aiText,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error: any) {
            console.error('❌ Groq call failed:', error?.message);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `عذراً، حدث خطأ: ${error?.message || 'خطأ غير معروف'}`,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChatHistory = () => {
        Alert.alert(
            'مسح المحادثة',
            'هل تريد مسح سجل المحادثة؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'مسح', onPress: () => setDefaultMessages() }
            ]
        );
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.sender === 'user' ? styles.userMessage : styles.aiMessage
        ]}>
            <View style={[
                styles.messageBubble,
                item.sender === 'user' && styles.userMessageBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userMessageText : styles.aiMessageText
                ]}>
                    {item.text}
                </Text>
                <Text style={styles.messageTime}>
                    {formatTime(item.timestamp)}
                </Text>
            </View>
        </View>
    );

    if (!isAuthenticated || !getUserId()) {
        return null;
    }

    return (
        <>
            {/* Floating Button */}
            <TouchableOpacity
                style={[styles.chatButton, { bottom: 20, right: 20 }]}
                onPress={() => {
                    setIsOpen(true);
                    setTimeout(() => {
                        inputRef.current?.focus();
                    }, 300);
                }}
                activeOpacity={0.8}
            >
                <Text style={styles.chatButtonText}>💬</Text>
            </TouchableOpacity>

            {/* Chat Modal */}
            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                >
                    <View style={[styles.chatWindow, { width: width * 0.9, height: height * 0.7 }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerIcon}>💬</Text>
                                <Text style={styles.headerTitle}>المساعد الذكي</Text>
                            </View>
                            <View style={styles.headerActions}>
                                <TouchableOpacity onPress={clearChatHistory} style={styles.headerButton}>
                                    <Text style={styles.headerButtonText}>🗑️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.headerButton}>
                                    <Text style={styles.headerButtonText}>−</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Messages */}
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.messagesList}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        />

                        {/* Loading Indicator */}
                        {isLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#4f46e5" />
                                <Text style={styles.loadingText}>جاري الكتابة...</Text>
                            </View>
                        )}

                        {/* Input Area */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                ref={inputRef}
                                style={styles.input}
                                value={inputMessage}
                                onChangeText={setInputMessage}
                                placeholder="اكتب رسالتك هنا..."
                                placeholderTextColor="#999"
                                multiline
                                textAlign="right"
                                textAlignVertical="center"
                                returnKeyType="send"
                                onSubmitEditing={sendMessage}
                                autoComplete="off"
                                autoCorrect={false}
                                spellCheck={false}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled]}
                                onPress={sendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                            >
                                <Text style={styles.sendButtonText}>➤</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    chatButton: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4f46e5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    chatButtonText: {
        fontSize: 28,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    chatWindow: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#4f46e5',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIcon: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonText: {
        fontSize: 16,
        color: 'white',
    },
    messagesList: {
        padding: 16,
        flexGrow: 1,
    },
    messageContainer: {
        marginBottom: 12,
        flexDirection: 'row',
    },
    userMessage: {
        justifyContent: 'flex-end',
    },
    aiMessage: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    userMessageBubble: {
        backgroundColor: '#4f46e5',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userMessageText: {
        color: 'white',
    },
    aiMessageText: {
        color: '#1e293b',
    },
    messageTime: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 4,
        textAlign: 'right',
    },
    loadingContainer: {
        padding: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: 'white',
        gap: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
        textAlign: 'right',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4f46e5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#cbd5e1',
    },
    sendButtonText: {
        fontSize: 18,
        color: 'white',
    },
});

export default AiChatBox;