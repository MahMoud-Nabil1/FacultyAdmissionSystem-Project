import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

const FRONTEND_URL: string = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Creates a Nodemailer transporter instance
 */
function createTransporter(): Transporter {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

/**
 * Sends a password reset link to the user's email
 * @param toEmail - Recipient's email address
 * @param token - Secure reset token generated in the controller
 */
export async function sendPasswordResetEmail(toEmail: string, token: string): Promise<void> {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[Dev] No SMTP credentials set. Reset link (for testing):', resetUrl);
        return;
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.SMTP_FROM || `"Faculty Admission System" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Reset your password – Faculty Admission System',
        text: `You requested a password reset.\n\nClick the link below to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                <h2 style="color: #1e293b;">Password Reset</h2>
                <p>You requested a password reset for your Faculty Admission System account.</p>
                <p style="margin: 30px 0;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:5px;font-weight:bold;">
                        Reset My Password
                    </a>
                </p>
                <p style="color:#64748b;font-size:0.85em;">This link is valid for 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                <p style="color:#94a3b8;font-size:0.75em;">If the button above doesn't work, copy and paste this URL into your browser:<br/>${resetUrl}</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw new Error('Email delivery failed');
    }
}