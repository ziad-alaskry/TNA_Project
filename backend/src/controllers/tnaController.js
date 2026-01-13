const {db} = require('../config/db');
const {generateTnaCode} = require('../utils/tnaGenerator');

const requestTna = (req, res) => {
    const visitor_id = req.user.id; // Taken from the JWT token, not the body!

    try {
        // 1. Check current active count
        const activeCount = db.prepare(`
            SELECT COUNT(*) as count FROM tnas 
            WHERE visitor_id = ? AND status = 'ACTIVE'
        `).get(visitor_id);

        if (activeCount.count >= 5) {
            return res.status(400).json({ 
                error: "Limit Reached. You can only have 5 active TNAs at a time." 
            });
        }

        // 2. Proceed with generation
        const tnaCode = generateTnaCode();
        const stmt = db.prepare('INSERT INTO tnas (tna_code, visitor_id) VALUES (?, ?)');
        stmt.run(tnaCode, visitor_id);

        res.status(201).json({ tna_code: tnaCode });
    } catch (err) {
        res.status(500).json({ error: "Failed to issue TNA." });
    }
};

const getActiveTna = (req, res) => {
    const visitor_id = req.params.visitor_id; // Still use param for now or req.user.id
    try {
        // Return ALL active TNAs for this visitor
        const rows = db.prepare(`
            SELECT tna_code FROM tnas 
            WHERE visitor_id = ? AND status = 'ACTIVE'
            ORDER BY id DESC
        `).all(visitor_id);
        
        res.json(rows); // Now returns an array [ {tna_code: '...'}, ... ]
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
};

module.exports = { requestTna, getActiveTna};

