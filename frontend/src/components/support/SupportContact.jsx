import React, { useState } from 'react';
import './css/SupportContact.css';
import { useTranslation } from 'react-i18next';

const SupportContact = ({ target = 'it' }) => {
    const { t, i18n } = useTranslation();
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
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (status.text) setStatus({ type: '', text: '' });
    };

    const validate = () => {
        const { studentCode, subjectName, message, replyEmail } = formData;


        if (!/^\d{7}$/.test(studentCode.trim()))
            return t('supportContact.validateStudentCode');


        if (!subjectName.trim()) {
            return isIT ? t('supportContact.validateSubjectIT') : t('supportContact.validateSubjectAdmin');
        }

        if (!message.trim()) return t('supportContact.validateMessage');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(replyEmail)) return t('supportContact.validateEmail');

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
            ? `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/students/contact-it`
            : `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/students/contact-admin`;

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
                    text: isIT ? t('supportContact.successIT') : t('supportContact.successAdmin'),
                });
                setFormData({ studentCode: '', subjectName: '', message: '', replyEmail: '' });
            } else {
                setStatus({ type: 'error', text: data.error || t('supportContact.errorGeneric') });
            }
        } catch (error) {
            setStatus({ type: 'error', text: t('supportContact.errorServer') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`contact-page ${isIT ? 'it-theme' : ''}`} dir={dir}>
            <div className="contact-card">
                <div className="contact-header">
                    <div className={`contact-icon ${isIT ? 'it' : 'admin'}`}>
                        {isIT ? '💻' : '🛡️'}
                    </div>
                    <h1>{isIT ? t('supportContact.itTitle') : t('supportContact.adminTitle')}</h1>
                </div>

                <div className="role-toggle">
                    <button type="button" className={`role-toggle-btn ${isIT ? 'active' : ''}`} onClick={() => setSelectedTarget('it')}> 💻 {t('supportContact.toggleIT')} </button>
                    <button type="button" className={`role-toggle-btn ${!isIT ? 'active' : ''}`} onClick={() => setSelectedTarget('admin')}> 🛡️ {t('supportContact.toggleAdmin')} </button>
                </div>

                <form className="contact-form" onSubmit={handleSubmit} noValidate>

                    <div className="form-group">
                        <label>{t('supportContact.studentCodeLabel')} <span className="required">*</span></label>
                        <input name="studentCode" value={formData.studentCode} onChange={handleChange} placeholder={t('supportContact.studentCodePlaceholder')} maxLength={7} />
                    </div>


                    <div className="form-group">
                        <label>
                            {isIT ? t('supportContact.subjectLabelIT') : t('supportContact.subjectLabelAdmin')}
                            <span className="required"> *</span>
                        </label>
                        <input
                            name="subjectName"
                            value={formData.subjectName}
                            onChange={handleChange}
                            placeholder={isIT ? t('supportContact.subjectPlaceholderIT') : t('supportContact.subjectPlaceholderAdmin')}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('supportContact.messageLabel')} <span className="required">*</span></label>
                        <textarea name="message" value={formData.message} onChange={handleChange} placeholder={t('supportContact.messagePlaceholder')} />
                    </div>

                    <div className="form-group">
                        <label>{t('supportContact.replyEmailLabel')} <span className="required">*</span></label>
                        <input type="email" name="replyEmail" value={formData.replyEmail} onChange={handleChange} placeholder="email@example.com" />
                    </div>

                    {status.text && <div className={`status-msg ${status.type}`}>{status.text}</div>}

                    <button type="submit" className={`submit-btn ${isIT ? 'it-btn' : 'admin-btn'}`} disabled={loading}>
                        {loading ? t('supportContact.loadingBtn') : t('supportContact.submitBtn')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SupportContact;
