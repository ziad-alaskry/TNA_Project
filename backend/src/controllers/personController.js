const { db } = require('../config/db');

/**
 * Get Personal Profile
 * Returns the data entered during Figma-based registration.
 */
const getMyProfile = (req, res) => {
    const userId = req.user.id;
    try {
        const user = db.prepare(`
            SELECT name, email, role, document_number, document_type, mobile, created_at 
            FROM persons WHERE id = ?
        `).get(userId);

        if (!user) return res.status(404).json({ error: "User not found." });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch profile." });
    }
};

/**
 * Admin: Get All Persons
 * Useful for the "System Admin" to monitor the 10-day project progress.
 */
const getAllPersons = (req, res) => {
    try {
        const rows = db.prepare('SELECT id, name, role, email FROM persons').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Access denied." });
    }
};

module.exports = { getMyProfile, getAllPersons };