const nodemailer = require('nodemailer');

// Create reusable transporter using SMTP
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise} - Resolves if email sent successfully
 */
const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"TNA Project" <noreply@tnaproject.com>',
        to: email,
        subject: 'Your Security Code - TNA Project',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Your Security Code</h2>
                <p>Hello,</p>
                <p>Your security code for TNA Project is:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #4CAF50; margin: 0; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
                </div>
                <p>This code will expire in <strong>5 minutes</strong>.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">TNA Project - Temporary Network Address System</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent to:', email, 'Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

module.exports = { sendOtpEmail };
