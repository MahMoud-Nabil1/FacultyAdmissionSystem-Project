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
        if (!/^2\d{6}$/.test(studentCode.trim()))
            return 'Student code must be 7 digits and start with 2 (e.g. 2327087).';
        if (!subjectName.trim()) return 'Please enter the course code (e.g. CS306).';
        if (!message.trim()) return 'Please describe your issue.';
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

        const successText = isIT
            ? 'Your message has been sent to the IT Support team. Check your email soon.'
            : 'Your message has been sent to the Admin. We will reply to your email soon.';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({
                    type: 'success',
                    text: successText,
                });
                setFormData({ studentCode: '', subjectName: '', message: '', replyEmail: '' });
            } else {
                setStatus({ type: 'error', text: data.error || 'Server rejected the request.' });
            }
        } catch (error) {
            setStatus({
                type: 'error',
                text: isIT
                    ? 'Connection failed. Is the server running?'
                    : 'Connection failed. Please check your network or server.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`contact-page ${isIT ? 'it-theme' : ''}`}>
            <div className="contact-card">
                <div className="contact-header">
                    <div className={`contact-icon ${isIT ? 'it' : 'admin'}`}>
                        {isIT ? '💻' : '🛡️'}
                    </div>
                    <h1>{isIT ? 'Contact IT Support' : 'Contact Administration'}</h1>
                    <p>
                        {isIT
                            ? 'Report a technical issue to the IT support team.'
                            : 'Send a message directly to the academic administration team.'}
                    </p>
                </div>

                <div className="role-toggle">
                    <button
                        type="button"
                        className={`role-toggle-btn ${isIT ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedTarget('it');
                            setStatus({ type: '', text: '' });
                        }}
                    >
                        💻 IT Support
                    </button>
                    <button
                        type="button"
                        className={`role-toggle-btn ${!isIT ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedTarget('admin');
                            setStatus({ type: '', text: '' });
                        }}
                    >
                        🛡️ Administration
                    </button>
                </div>

                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor={`${isIT ? 'it' : 'admin'}-studentCode`}>
                            Student Code <span className="required">*</span>
                        </label>
                        <input
                            id={`${isIT ? 'it' : 'admin'}-studentCode`}
                            type="text"
                            name="studentCode"
                            value={formData.studentCode}
                            onChange={handleChange}
                            placeholder="e.g. 2327087"
                            maxLength={7}
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={`${isIT ? 'it' : 'admin'}-subjectName`}>
                            Course Code <span className="required">*</span>
                        </label>
                        <input
                            id={`${isIT ? 'it' : 'admin'}-subjectName`}
                            type="text"
                            name="subjectName"
                            value={formData.subjectName}
                            onChange={handleChange}
                            placeholder="e.g. CS306, MATH201 …"
                            autoComplete="off"
                        />
                    </div>

                    <hr className="form-divider" />

                    <div className="form-group">
                        <label htmlFor={`${isIT ? 'it' : 'admin'}-message`}>
                            Describe Your Issue <span className="required">*</span>
                        </label>
                        <textarea
                            id={`${isIT ? 'it' : 'admin'}-message`}
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Write your issue here… (Arabic is also accepted)"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={`${isIT ? 'it' : 'admin'}-replyEmail`}>
                            Reply Email <span className="required">*</span>
                        </label>
                        <input
                            id={`${isIT ? 'it' : 'admin'}-replyEmail`}
                            type="email"
                            name="replyEmail"
                            value={formData.replyEmail}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            autoComplete="email"
                        />
                    </div>

                    {status.text && (
                        <div className={`status-msg ${status.type}`}>{status.text}</div>
                    )}

                    <button
                        type="submit"
                        className={`submit-btn ${isIT ? 'it-btn' : 'admin-btn'}`}
                        disabled={loading}
                    >
                        {loading
                            ? 'Sending…'
                            : isIT
                                ? 'Send to IT Support'
                                : 'Send to Administration'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SupportContact;

