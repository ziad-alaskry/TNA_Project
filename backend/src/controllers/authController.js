const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const register = async (req, res) => {
    // Expanded destructuring to match Figma registration fields
    const { name, email, password, role, document_number, document_type, mobile } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Name, Email, Password, Role, and ID Number are required." });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);

        const stmt = db.prepare(`
            INSERT INTO persons (name, email, password_hash, role, document_number, document_type, mobile) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            name,
            email,
            password_hash,
            role.toUpperCase(),
            document_number,
            document_type || 'PASSPORT', // Defaulting to Passport per Figma Page 4
            mobile
        );

        res.status(201).json({
            message: "User account created successfully",
            userId: info.lastInsertRowid
        });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: "Email or ID Number already registered." });
        }
        res.status(500).json({ error: "Registration failed." });
    }
};

const JWT_SECRET = process.env.JWT_SECRET;
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = db.prepare('SELECT * FROM persons WHERE email = ?').get(email);

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed." });
    }
};

// In-memory OTP cache: { email: { otp, expiresAt } }
const otpCache = {};

const sendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    try {
        // Verify user exists
        const user = db.prepare('SELECT * FROM persons WHERE email = ?').get(email);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in cache with 5-minute expiry
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now
        otpCache[email] = { otp, expiresAt };

        // Send OTP via email
        const { sendOtpEmail } = require('../services/emailService');
        await sendOtpEmail(email, otp);

        res.json({
            message: "Security code sent to your email.",
            expiresIn: "5 minutes"
        });
    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ error: "Failed to send security code." });
    }
};

const verifySecurityCode = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required." });
    }

    try {
        // Check if OTP exists in cache
        const cachedOtp = otpCache[email];

        if (!cachedOtp) {
            return res.status(400).json({ error: "No OTP found. Please request a new one." });
        }

        // Check if OTP has expired
        if (Date.now() > cachedOtp.expiresAt) {
            delete otpCache[email]; // Clean up expired OTP
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        // Verify OTP matches
        if (cachedOtp.otp !== otp) {
            return res.status(401).json({ error: "Invalid security code." });
        }

        // OTP verified successfully - clean up cache
        delete otpCache[email];

        // Get user details and issue JWT token
        const user = db.prepare('SELECT * FROM persons WHERE email = ?').get(email);

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Security code verified successfully.",
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: "Failed to verify security code." });
    }
};

const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: "Email, OTP, and New Password are required." });
    }

    try {
        // Check if OTP exists in cache
        const cachedOtp = otpCache[email];

        if (!cachedOtp) {
            return res.status(400).json({ error: "No valid OTP found. Please request a new code." });
        }

        // Check if OTP has expired
        if (Date.now() > cachedOtp.expiresAt) {
            delete otpCache[email];
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        // Verify OTP matches
        if (cachedOtp.otp !== otp) {
            return res.status(401).json({ error: "Invalid security code." });
        }

        // Hash the new password
        const password_hash = await bcrypt.hash(newPassword, 10);

        // Update password in database
        const stmt = db.prepare('UPDATE persons SET password_hash = ? WHERE email = ?');
        const info = stmt.run(password_hash, email);

        if (info.changes === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        // Clean up OTP cache
        delete otpCache[email];

        res.json({ message: "Password reset successfully. You can now login with your new password." });

    } catch (err) {
        console.error('Reset Password error:', err);
        res.status(500).json({ error: "Failed to reset password." });
    }
};

module.exports = { register, login, sendOtp, verifySecurityCode, resetPassword };