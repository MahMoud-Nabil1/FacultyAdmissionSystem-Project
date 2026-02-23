import React, { useState } from 'react';

const ITContact = () => {
    const [formData, setFormData] = useState({
        studentCode: '',
        subjectName: '',
        message: '',
        replyEmail: '',
    });

    const [status, setStatus] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

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

        try {
            // the api call will be here

            setStatus({
                type: 'success',
                text: 'Your message has been sent to the IT Support team. We will reply to your email soon.',
            });
            setFormData({ studentCode: '', subjectName: '', message: '', replyEmail: '' });
        } catch {
            setStatus({ type: 'error', text: 'Something went wrong. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page it-theme">
            <div className="contact-card">
                {/* Header */}
                <div className="contact-header">
                    <div className="contact-icon it">💻</div>
                    <h1>Contact IT Support</h1>
                    <p>Report a technical issue to the IT support team.</p>
                </div>


                <form className="contact-form" onSubmit={handleSubmit} noValidate>

                    <div className="form-group">
                        <label htmlFor="it-studentCode">
                            Student Code <span className="required">*</span>
                        </label>
                        <input
                            id="it-studentCode"
                            type="text"
                            name="studentCode"
                            value={formData.studentCode}
                            onChange={handleChange}
                            placeholder="e.g. 2327087  (7 digits, starts with 2)"
                            maxLength={7}
                            autoComplete="off"
                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="it-subjectName">
                            Course Code <span className="required">*</span>
                        </label>
                        <input
                            id="it-subjectName"
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
                        <label htmlFor="it-message">
                            Describe Your Issue <span className="required">*</span>
                        </label>
                        <textarea
                            id="it-message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Write your issue here… (Arabic is also accepted)"
                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="it-replyEmail">
                            Reply Email <span className="required">*</span>
                        </label>
                        <input
                            id="it-replyEmail"
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
                        className="submit-btn it-btn"
                        disabled={loading}
                    >
                        {loading ? 'Sending…' : 'Send to IT Support'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ITContact;