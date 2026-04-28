import React, { useState, useRef, useEffect } from 'react';
import './css/aiChatBox.css';
import { useAuth } from '../../context/AuthContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const AiChatBox: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get storage key based on user (different key for each user)
    const getStorageKey = () => {
        if (user?.id) {
            return `aiChatMessages_${user.id}`;
        }
        return null;
    };

    // Load messages from localStorage on mount or when user changes
    useEffect(() => {
        if (user?.id) {
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
            // No user logged in, clear messages
            setMessages([]);
        }
    }, [user]);

    // Save messages to localStorage whenever they change (only if user is logged in)
    useEffect(() => {
        if (user?.id && messages.length > 0) {
            const storageKey = getStorageKey();
            if (storageKey) {
                localStorage.setItem(storageKey, JSON.stringify(messages));
            }
        }
    }, [messages, user]);

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
        if (user?.id) {
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

        // Simulate AI response (replace with actual API later)
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: getAutoResponse(inputMessage),
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 500);
    };

    // Temporary auto-response function
    const getAutoResponse = (message: string): string => {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('مرحب') || lowerMsg.includes('hello')) {
            return 'أهلاً بك! كيف يمكنني مساعدتك اليوم؟';
        }
        if (lowerMsg.includes('شكر')) {
            return 'العفو! أنا هنا لمساعدتك في أي وقت.';
        }
        if (lowerMsg.includes('تسجيل') || lowerMsg.includes('مواد')) {
            return 'يمكنك تسجيل المواد من خلال الذهاب إلى صفحة "تسجيل المواد" في القائمة الرئيسية.';
        }
        if (lowerMsg.includes('جدول') || lowerMsg.includes('مجموعات')) {
            return 'لعرض الجدول الدراسي، اذهب إلى صفحة "المجموعات" لمشاهدة جميع المجموعات المتاحة.';
        }
        if (lowerMsg.includes('شكوى') || lowerMsg.includes('طلب')) {
            return 'لتقديم شكوى، استخدم صفحة "الشكاوى" حيث يمكنك إنشاء طلب جديد ومتابعة حالته.';
        }
        return 'شكراً لسؤالك. هل يمكنك توضيح أكثر؟ أنا هنا لمساعدتك في الاستفسارات المتعلقة بالنظام الأكاديمي.';
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

    // Don't render chat if user is not logged in
    if (!user?.id) {
        return null;
    }

    return (
        <>
            {/* Floating Circle Button */}
            <button
                className={`ai-chat-circle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? '✕' : '🤖'}
                {messages.length > 0 && !isOpen && (
                    <span className="chat-badge">{messages.length}</span>
                )}
            </button>

            {/* Small Floating Chat Window */}
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <div className="header-info">
                            <span className="header-icon">🤖</span>
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