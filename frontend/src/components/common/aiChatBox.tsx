import React, { useState, useRef, useEffect } from 'react';
import './css/aiChatBox.css';
import { useAuth } from '../../context/AuthContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface StudentData {
    id?: string;
    name?: string;
    email?: string;
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

const AiChatBox: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get full student data
    const getStudentData = (): StudentData => {
        return {
            id: user?.id || user?._id,
            name: user?.name,
            email: user?.email,
            role: user?.role,
            studentId: user?.studentId,
            gpa: user?.gpa,
            department: user?.department,
            level: user?.level,
            registeredHours: user?.registeredHours,
            completedHours: user?.completedHours,
            completedSubjects: user?.completedSubjects,
            registeredSubjects: user?.registeredSubjects
        };
    };

    // Get user ID from various possible fields
    const getUserId = () => {
        return user?.id || user?._id || user?.studentId || null;
    };

    // Get storage key based on user
    const getStorageKey = () => {
        const userId = getUserId();
        if (userId) {
            return `aiChatMessages_${userId}`;
        }
        return null;
    };

    // Load messages from localStorage on mount or when user changes
    useEffect(() => {
        if (isAuthenticated && getUserId()) {
            const storageKey = getStorageKey();
            const savedMessages = localStorage.getItem(storageKey);
            if (savedMessages) {
                try {
                    const parsedMessages = JSON.parse(savedMessages);
                    const messagesWithDates = parsedMessages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }));
                    setMessages(messagesWithDates);
                } catch (error) {
                    console.error('Error loading messages:', error);
                    setDefaultMessages();
                }
            } else {
                setDefaultMessages();
            }
        } else {
            setMessages([]);
        }
    }, [user, isAuthenticated]);

    // Save messages to localStorage
    useEffect(() => {
        if (isAuthenticated && getUserId() && messages.length > 0) {
            const storageKey = getStorageKey();
            if (storageKey) {
                localStorage.setItem(storageKey, JSON.stringify(messages));
            }
        }
    }, [messages, isAuthenticated]);

    const setDefaultMessages = () => {
        const defaultMessages = [
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
                localStorage.setItem(storageKey, JSON.stringify(defaultMessages));
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [isOpen, messages]);

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');

        // Get full student data to send with the message
        const studentData = getStudentData();

        // Log all student data (for debugging)
        console.log('Sending message with student data:', studentData);

        // Simulate AI response with student data context
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: getAutoResponse(inputMessage, studentData),
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 500);
    };

    // Enhanced AI response with student data
    const getAutoResponse = (message: string, studentData: StudentData): string => {
        const lowerMsg = message.toLowerCase();

        // Personal info responses
        if (lowerMsg.includes('اسمي') || lowerMsg.includes('من انا') || lowerMsg.includes('عرفني')) {
            return `أنت ${studentData.name || 'طالب'}${studentData.studentId ? ` برقم جامعي ${studentData.studentId}` : ''}${studentData.department ? ` في قسم ${studentData.department}` : ''}. كيف يمكنني مساعدتك اليوم؟`;
        }

        if (lowerMsg.includes('رقمي') || lowerMsg.includes('الرقم الجامعي')) {
            return studentData.studentId ? `رقمك الجامعي هو: ${studentData.studentId}` : 'لم يتم العثور على رقمك الجامعي في النظام.';
        }

        if (lowerMsg.includes('معدلي') || lowerMsg.includes('gpa') || lowerMsg.includes('المعدل')) {
            return studentData.gpa ? `معدلك التراكمي الحالي هو: ${studentData.gpa}` : 'لم يتم العثور على معدلك التراكمي في النظام.';
        }

        if (lowerMsg.includes('المستوى') || lowerMsg.includes('level')) {
            return studentData.level ? `أنت في المستوى: ${studentData.level}` : 'لم يتم تحديد مستواك الدراسي بعد.';
        }

        if (lowerMsg.includes('ساعات') || lowerMsg.includes('credits')) {
            let response = '';
            if (studentData.registeredHours) {
                response += `عدد الساعات المسجلة: ${studentData.registeredHours}\n`;
            }
            if (studentData.completedHours) {
                response += `عدد الساعات المكتملة: ${studentData.completedHours}`;
            }
            return response || 'لم يتم العثور على معلومات الساعات الدراسية.';
        }

        if (lowerMsg.includes('القسم') || lowerMsg.includes('department')) {
            return studentData.department ? `قسمك هو: ${studentData.department}` : 'لم يتم تحديد قسمك بعد.';
        }

        // General responses
        if (lowerMsg.includes('مرحب') || lowerMsg.includes('hello') || lowerMsg.includes('السلام')) {
            return `أهلاً بك ${studentData.name || 'عزيزي الطالب'}! كيف يمكنني مساعدتك اليوم؟`;
        }

        if (lowerMsg.includes('شكر')) {
            return 'العفو! أنا هنا لمساعدتك في أي وقت.';
        }

        if (lowerMsg.includes('تسجيل') || lowerMsg.includes('مواد') || lowerMsg.includes('register')) {
            return `يمكنك تسجيل المواد من خلال الذهاب إلى صفحة "تسجيل المواد" في القائمة الرئيسية.${studentData.gpa ? `\n\nمعلومة: معدلك الحالي ${studentData.gpa}` : ''}`;
        }

        if (lowerMsg.includes('جدول') || lowerMsg.includes('مجموعات') || lowerMsg.includes('schedule')) {
            return 'لعرض الجدول الدراسي، اذهب إلى صفحة "المجموعات" لمشاهدة جميع المجموعات المتاحة وتفاصيلها.';
        }

        if (lowerMsg.includes('شكوى') || lowerMsg.includes('طلب') || lowerMsg.includes('complaint')) {
            return 'لتقديم شكوى، استخدم صفحة "الشكاوى" حيث يمكنك إنشاء طلب جديد ومتابعة حالته.';
        }

        if (lowerMsg.includes('مساعدة') || lowerMsg.includes('help')) {
            return `أهلاً ${studentData.name || 'عزيزي الطالب'}! يمكنني مساعدتك في:\n- معرفة معلوماتك الشخصية (الرقم الجامعي، المعدل، المستوى)\n- تسجيل المواد\n- عرض الجدول الدراسي\n- تقديم الشكاوى\n- معلومات عن النظام\n\nما الذي تريد معرفته؟`;
        }

        // Default response with personal touch
        return `شكراً لسؤالك ${studentData.name || 'عزيزي الطالب'}. هل يمكنك توضيح أكثر؟ أنا هنا لمساعدتك في الاستفسارات المتعلقة بالنظام الأكاديمي.`;
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChatHistory = () => {
        if (window.confirm('هل تريد مسح سجل المحادثة؟')) {
            setDefaultMessages();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    // Don't render chat if user is not authenticated
    if (!isAuthenticated || !getUserId()) {
        return null;
    }

    return (
        <>
            <button
                className={`ai-chat-circle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <div className="header-info">
                            <span className="header-icon">💬</span>
                            <span className="header-title">المساعد الذكي</span>
                        </div>
                        <div className="header-actions">
                            <button
                                className="clear-button"
                                onClick={clearChatHistory}
                                title="مسح المحادثة"
                            >
                                🗑️
                            </button>
                            <button
                                className="minimize-button"
                                onClick={() => setIsOpen(false)}
                            >
                                −
                            </button>
                        </div>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                            >
                                <div className="message-bubble">
                                    <div className="message-text">{message.text}</div>
                                    <div className="message-time">{formatTime(message.timestamp)}</div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-chat-input">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="اكتب رسالتك هنا..."
                        />
                        <button onClick={handleSendMessage}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiChatBox;