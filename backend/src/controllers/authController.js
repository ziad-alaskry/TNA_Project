const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const register = async (req, res) => {
    // Expanded destructuring to match Figma registration fields
    const { name, email, password, role, document_number, document_type, mobile } = req.body;

    if (!name || !email || !password || !role || !document_number) {
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

module.exports = { register, login };