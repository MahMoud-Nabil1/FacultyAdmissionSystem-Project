const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Send password reset email with link containing token.
 * In development without SMTP config, logs the link to console.
 */
async function sendPasswordResetEmail(toEmail, token) {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_FROM || '"Faculty Admission" <noreply@example.com>',
        to: toEmail,
        subject: 'Reset your password',
        text: `You requested a password reset. Open this link to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `<p>You requested a password reset. <a href="${resetUrl}">Click here to set a new password</a> (valid for 1 hour).</p><p>If you did not request this, ignore this email.</p>`
    };

    try {
        if (!process.env.SMTP_USER) {
            console.log('[Dev] Password reset link (no SMTP configured):', resetUrl);
            return;
        }
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Send reset email failed:', err.message);
        throw err;
    }
}

module.exports = { sendPasswordResetEmail };
