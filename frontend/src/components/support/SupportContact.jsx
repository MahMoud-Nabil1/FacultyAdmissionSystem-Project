import React, { useState } from 'react';
import './css/SupportContact.css';

const SupportContact = ({ target = 'it' }) => {
    const [formData, setFormData] = useState({
        studentCode: '',
        subjectName: '',
        message: '',
        replyEmail: '',
    });

    const [status, setStatus] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState(target);

    const isIT = selectedTarget === 'it';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (status.text) setStatus({ type: '', text: '' });
    };

    const validate = () => {
        const { studentCode, subjectName, message, replyEmail } = formData;


        if (!/^\d{7}$/.test(studentCode.trim()))
            return 'يجب أن يتكون كود الطالب من 7 أرقام.';


        if (!subjectName.trim()) {
            return isIT ? 'يرجى إدخال موضوع المشكلة.' : 'الرجاء إدخال كود المقرر الدراسي.';
        }

        if (!message.trim()) return 'يرجى وصف مشكلتك بالتفصيل.';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(replyEmail)) return 'Please enter a valid reply email.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validate();
        if (error) {
            setStatus({ type: 'error', text: error });
            return;
        }

        setLoading(true);
        setStatus({ type: '', text: '' });

        const endpoint = isIT
            ? 'http://localhost:5000/api/students/contact-it'
            : 'http://localhost:5000/api/students/contact-admin';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({
                    type: 'success',
                    text: isIT ? 'تم إرسال طلب الدعم الفني بنجاح.' : 'تم إرسال طلبك للإدارة بنجاح.',
                });
                setFormData({ studentCode: '', subjectName: '', message: '', replyEmail: '' });
            } else {
                setStatus({ type: 'error', text: data.error || 'حدث خطأ ما.' });
            }
        } catch (error) {
            setStatus({ type: 'error', text: 'فشل الاتصال بالسيرفر.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`contact-page ${isIT ? 'it-theme' : ''}`} dir="rtl">
            <div className="contact-card">
                <div className="contact-header">
                    <div className={`contact-icon ${isIT ? 'it' : 'admin'}`}>
                        {isIT ? '💻' : '🛡️'}
                    </div>
                    <h1>{isIT ? 'الدعم الفني' : 'شؤون الطلاب والادارة'}</h1>
                </div>

                <div className="role-toggle">
                    <button type="button" className={`role-toggle-btn ${isIT ? 'active' : ''}`} onClick={() => setSelectedTarget('it')}> 💻 IT </button>
                    <button type="button" className={`role-toggle-btn ${!isIT ? 'active' : ''}`} onClick={() => setSelectedTarget('admin')}> 🛡️ الإدارة </button>
                </div>

                <form className="contact-form" onSubmit={handleSubmit} noValidate>

                    <div className="form-group">
                        <label>كود الطالب <span className="required">*</span></label>
                        <input name="studentCode" value={formData.studentCode} onChange={handleChange} placeholder="7 أرقام" maxLength={7} />
                    </div>


                    <div className="form-group">
                        <label>
                            {isIT ? 'موضوع المشكلة' : 'كود المقرر الدراسي'}
                            <span className="required"> *</span>
                        </label>
                        <input
                            name="subjectName"
                            value={formData.subjectName}
                            onChange={handleChange}
                            placeholder={isIT ? "الموضوع" : "مثال: CS306"}
                        />
                    </div>

                    <hr className="form-divider" />

                    <div className="form-group">
                        <label>تفاصيل الرسالة <span className="required">*</span></label>
                        <textarea name="message" value={formData.message} onChange={handleChange} placeholder="اشرح لنا المشكلة..." />
                    </div>

                    <div className="form-group">
                        <label>بريد الرد <span className="required">*</span></label>
                        <input type="email" name="replyEmail" value={formData.replyEmail} onChange={handleChange} placeholder="email@example.com" />
                    </div>

                    {status.text && <div className={`status-msg ${status.type}`}>{status.text}</div>}

                    <button type="submit" className={`submit-btn ${isIT ? 'it-btn' : 'admin-btn'}`} disabled={loading}>
                        {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SupportContact;
