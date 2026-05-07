import React, { useState, useRef, useEffect } from 'react';
import './css/aiChatBox.css';
import { useAuth } from '../../context/AuthContext';
import { getAllSubjects, getAllGroups, apiGet } from '../../services/api';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const DAYS_AR: Record<string, string> = {
    saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين',
    tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة'
};

const formatHour = (h: number) => {
    const suffix = h >= 12 ? 'م' : 'ص';
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}:00 ${suffix}`;
};

const AiChatBox: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [contextLoading, setContextLoading] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState<string>('');
    const [contextLoaded, setContextLoaded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const getUserId = () => user?.id || user?._id || user?.studentId || null;
    const getStorageKey = () => {
        const userId = getUserId();
        return userId ? `aiChatMessages_${userId}` : null;
    };

    // Build a compact but rich system prompt
    const buildSystemPrompt = (
        studentMe: any,
        subjects: any[],
        groups: any[]
    ): string => {
        // Map subject _id → subject object
        const subjectById = new Map<string, any>();
        subjects.forEach(s => subjectById.set(s._id?.toString(), s));

        // Map subject code (lowercase) → subject object
        const subjectByCode = new Map<string, any>();
        subjects.forEach(s => subjectByCode.set(s.code?.toLowerCase(), s));

        // Find groups the student is enrolled in
        const studentObjId = studentMe?._id?.toString();
        const myGroups = groups.filter(g => {
            const students = g.students || [];
            return students.some((s: any) =>
                (typeof s === 'object' ? s._id?.toString() : s?.toString()) === studentObjId
            );
        });

        // Resolve completed subject IDs → names
        const completedIds: string[] = studentMe?.completedSubjects || [];
        const completedNames = completedIds.map(id => {
            const sub = subjectById.get(id?.toString());
            return sub ? `${sub.code?.toUpperCase()}(${sub.creditHours}h)` : null;
        }).filter(Boolean);

        const completedHours = completedIds.reduce((t, id) => {
            const sub = subjectById.get(id?.toString());
            return t + (sub?.creditHours || 0);
        }, 0);

        let level = '1';
        if (completedHours > 90) level = '4';
        else if (completedHours > 60) level = '3';
        else if (completedHours > 30) level = '2';

        // Helper: format a group to one compact line
        const fmtGroup = (g: any) => {
            const sub = subjectByCode.get(g.subject?.toLowerCase());
            const name = sub?.name || g.subject?.toUpperCase() || '?';
            const code = g.subject?.toUpperCase() || '?';
            const day = DAYS_AR[g.day?.toLowerCase()] || g.day || '?';
            const time = `${formatHour(g.from || 0)}-${formatHour(g.to || 0)}`;
            const place = g.place || '?';
            const enrolled = (g.students || []).length;
            const cap = g.capacity || '?';
            return `${code}|${name}|G${g.number}|${g.type}|${day}|${time}|${place}|${enrolled}/${cap}`;
        };

        // My enrolled groups — full detail
        const myGroupLines = myGroups.map(g => {
            const sub = subjectByCode.get(g.subject?.toLowerCase());
            const name = sub?.name || g.subject?.toUpperCase();
            const day = DAYS_AR[g.day?.toLowerCase()] || g.day;
            return `  • ${name} | مجموعة ${g.number} | ${g.type} | ${day} ${formatHour(g.from)}-${formatHour(g.to)}${g.place ? ' | ' + g.place : ''}`;
        }).join('\n') || '  لا توجد مجموعات مسجلة';

        // All subjects — compact one-liners (code | name | hours | prereqs)
        const subjectLines = subjects.map(s => {
            const prereqs = (s.prerequisites || []).map((p: any) => p.code || '').filter(Boolean).join(',');
            return `${s.code?.toUpperCase()}|${s.name}|${s.creditHours}h${prereqs ? '|pre:' + prereqs : ''}`;
        }).join('\n');

        // All groups — compact one-liners
        const groupLines = groups.map(fmtGroup).join('\n');

        return `أنت مساعد ذكي لنظام القبول الجامعي. أجب دائماً بالعربية، بشكل مختصر ومفيد.

[بيانات الطالب]
الاسم: ${studentMe?.name || '?'} | ID: ${studentMe?.id || studentMe?._id || '?'} | GPA: ${studentMe?.gpa ?? '?'} | المستوى: ${level} | الساعات المكتملة: ${completedHours}
المواد المكتملة: ${completedNames.join(', ') || 'لا توجد'}

[مجموعاتي المسجلة - ${myGroups.length} مجموعة]
${myGroupLines}

[كل المواد - ${subjects.length} مادة - الصيغة: CODE|الاسم|الساعات|المتطلبات]
${subjectLines}

[كل المجموعات - ${groups.length} مجموعة - الصيغة: CODE|الاسم|رقم المجموعة|النوع|اليوم|الوقت|القاعة|المقاعد]
${groupLines}

[تعليمات] أجب بناءً على البيانات أعلاه فقط. إذا سُئلت عن الجدول استخدم "مجموعاتي المسجلة". إذا سُئلت عن مواد متاحة ابحث في قائمة المواد وتحقق من المتطلبات مقابل المواد المكتملة.`;
    };

    // Fetch all context when chat opens
    useEffect(() => {
        if (isOpen && !contextLoaded && isAuthenticated) {
            fetchContext();
        }
    }, [isOpen]);

    const fetchContext = async () => {
        setContextLoading(true);
        try {
            // Fetch from /auth/me for full student profile
            const [meRes, subjectsRes, groupsRes] = await Promise.allSettled([
                apiGet('/auth/me'),
                getAllSubjects(),
                getAllGroups()
            ]);

            const studentMe = meRes.status === 'fulfilled' ? meRes.value?.data : user;
            const subjects = subjectsRes.status === 'fulfilled'
                ? (Array.isArray(subjectsRes.value) ? subjectsRes.value : []) : [];
            const groups = groupsRes.status === 'fulfilled'
                ? (Array.isArray(groupsRes.value) ? groupsRes.value : []) : [];

            console.log('✅ AI Context loaded:', {
                student: studentMe?.name,
                subjects: subjects.length,
                groups: groups.length,
                myGroups: groups.filter((g: any) =>
                    (g.students || []).some((s: any) =>
                        (typeof s === 'object' ? s._id : s)?.toString() === studentMe?._id?.toString()
                    )
                ).length
            });
            // 🔍 DEBUG: log raw shapes so we can see actual field names
            if (subjects.length > 0) console.log('📚 Sample subject:', JSON.stringify(subjects[0], null, 2));
            if (groups.length > 0) console.log('👥 Sample group:', JSON.stringify(groups[0], null, 2));
            console.log('👤 Student /auth/me:', JSON.stringify(studentMe, null, 2));

            const prompt = buildSystemPrompt(studentMe, subjects, groups);
            setSystemPrompt(prompt);
            setContextLoaded(true);
        } catch (error) {
            console.error('Failed to load AI context:', error);
            setSystemPrompt(`أنت مساعد ذكي لنظام القبول الجامعي. اسم الطالب: ${user?.name || 'غير محدد'}. تحدث بالعربية.`);
            setContextLoaded(true);
        } finally {
            setContextLoading(false);
        }
    };

    // Load messages from localStorage
    useEffect(() => {
        if (isAuthenticated && getUserId()) {
            const storageKey = getStorageKey();
            const savedMessages = localStorage.getItem(storageKey);
            if (savedMessages) {
                try {
                    const parsed = JSON.parse(savedMessages);
                    setMessages(parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
                } catch {
                    setDefaultMessages();
                }
            } else {
                setDefaultMessages();
            }
        } else {
            setMessages([]);
        }
    }, [user, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && getUserId() && messages.length > 0) {
            const storageKey = getStorageKey();
            if (storageKey) localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages]);

    const setDefaultMessages = () => {
        const defaults: Message[] = [{
            id: '1',
            text: `مرحباً ${user?.name ? user.name.split(' ')[0] : ''}! 👋 أنا مساعدك الذكي. يمكنني مساعدتك في معلوماتك الأكاديمية، المواد، المجموعات، وأي استفسار عن النظام.`,
            sender: 'ai',
            timestamp: new Date()
        }];
        setMessages(defaults);
        const storageKey = getStorageKey();
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(defaults));
    };

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [isOpen, messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading || contextLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputMessage('');
        setIsLoading(true);

        try {
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
                        { role: 'user', content: inputMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 600
                })
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(`Groq error ${response.status}: ${errBody?.error?.message || 'Unknown'}`);
            }

            const data = await response.json();
            const aiText = data?.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من الرد. حاول مرة أخرى.';

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: aiText,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } catch (error: any) {
            console.error('❌ Groq call failed:', error?.message);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `عذراً، حدث خطأ: ${error?.message || 'خطأ غير معروف'}`,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (!isAuthenticated || !getUserId()) return null;

    const inputDisabled = isLoading || contextLoading;

    return (
        <>
            <button
                className={`ai-chat-circle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="المساعد الذكي"
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <div className="header-info">
                            <div className="header-avatar">🤖</div>
                            <div className="header-text">
                                <span className="header-title">المساعد الذكي</span>
                                <span className="header-subtitle">
                                    {contextLoading ? '⏳ جاري تحميل بياناتك...' : '🟢 متاح الآن'}
                                </span>
                            </div>
                        </div>
                        <button className="minimize-button" onClick={() => setIsOpen(false)} title="إغلاق">✕</button>
                    </div>

                    <div className="ai-chat-messages">
                        {messages.map((message) => (
                            <div key={message.id} className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                                {message.sender === 'ai' && <div className="message-avatar">🤖</div>}
                                <div className="message-bubble">
                                    <div className="message-text">{message.text}</div>
                                    <div className="message-time">{formatTime(message.timestamp)}</div>
                                </div>
                            </div>
                        ))}
                        {(isLoading || contextLoading) && (
                            <div className="message ai-message">
                                <div className="message-avatar">🤖</div>
                                <div className="message-bubble">
                                    <div className="typing-indicator"><span></span><span></span><span></span></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-chat-input">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={contextLoading ? 'جاري تحميل بياناتك...' : 'اكتب رسالتك هنا...'}
                            disabled={inputDisabled}
                        />
                        <button onClick={handleSendMessage} disabled={inputDisabled || !inputMessage.trim()}>
                            {isLoading ? '⏳' : '➤'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiChatBox;