const nodemailer = require('nodemailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';


function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}


async function sendPasswordResetEmail(toEmail, token) {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[Dev] No SMTP credentials set. Reset link (for testing):', resetUrl);
        return;
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.SMTP_FROM || `"Faculty Admission System" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Reset your password – Faculty Admission System',
        text: `You requested a password reset.\n\nClick the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
                <h2>Password Reset</h2>
                <p>You requested a password reset for your Faculty Admission System account.</p>
                <p>
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:5px;">
                        Reset My Password
                    </a>
                </p>
                <p style="color:#888;font-size:0.85em;">This link is valid for 1 hour. If you didn't request a reset, ignore this email.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
