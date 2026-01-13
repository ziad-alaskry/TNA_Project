/**
 * This controller handles the logic of taking a base National Address,
 * appending a 4-letter suffix to create a unique "NA Variant."
 */
const { db } = require('../config/db');

const registerAddressVariant = (req, res) => {
    // SECURE FIX: Get owner_id from req.user (populated by authorize middleware)
    // instead of req.body.
    const owner_id = req.user.id; 
    const { base_address, suffix } = req.body; 

    // 1. STABILITY CHECK
    if (!base_address || base_address === "undefined") {
        return res.status(400).json({ error: "Base address is required." });
    }
    
    // 2. VALIDATION
    if (!suffix || suffix.length !== 4) {
        return res.status(400).json({ error: 'Suffix must be exactly 4 characters.' });
    } 

    try {
        // 3. ROLE VERIFICATION
        // Even though middleware checks role, we verify the ID exists in persons
        const person = db.prepare('SELECT role FROM persons WHERE id = ?').get(owner_id);
        
        if (!person || person.role !== 'OWNER') {
            // CRITICAL: added 'return' so execution stops here
            return res.status(403).json({ error: 'Only owners can register address variants.' });
        }

        // 4. CONSTRUCT ADDRESS
        const full_address = `${base_address} - ${suffix.toUpperCase()}`;

        // 5. SAVE TO DB 
        const stmt = db.prepare(`
            INSERT INTO na_variants (owner_id, base_address, suffix, full_address)
            VALUES (?, ?, ?, ?)
        `);

        const info = stmt.run(owner_id, base_address, suffix.toUpperCase(), full_address);

        return res.status(201).json({
            id: info.lastInsertRowid,
            full_address: full_address,
            message: 'Address variant registered successfully.'
        });

    } catch (err) {
        console.error("DB Error:", err);
        // Use return to ensure only one response is sent
        return res.status(500).json({ error: "Database error during registration." });
    }
}

// SECURE VERSION: Always uses the ID from the token
const getMyProperties = (req, res) => {
    const owner_id = req.user.id; 
    try {
        const rows = db.prepare('SELECT * FROM na_variants WHERE owner_id = ?').all(owner_id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch properties" });
    }
};

module.exports = { registerAddressVariant, getMyProperties };