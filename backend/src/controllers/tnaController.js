const { db } = require('../config/db');
const { generateTnaCode } = require('../utils/tnaGenerator');

/**
 * Request a new TNA
 * Enforces the "Project A" rule: Max 5 active TNAs per user.
 */
const requestTna = (req, res) => {
    // Extract ID from JWT (Injected by authorize middleware)
    const visitor_id = req.user.id; 

    try {
        // 1. Check current active count
        const activeCount = db.prepare(`
            SELECT COUNT(*) as count FROM tnas 
            WHERE visitor_id = ? AND status = 'ACTIVE'
        `).get(visitor_id);

        // 2. Enforce "Project A" constraint
        if (activeCount.count >= 5) {
            return res.status(400).json({ 
                error: "Limit Reached. You can only have 5 active TNAs at a time." 
            });
        }

        // 3. Generate and Save TNA
        const tnaCode = generateTnaCode();
        
        // Added 'status' to the insert to ensure it starts as ACTIVE
        const stmt = db.prepare('INSERT INTO tnas (tna_code, visitor_id, status) VALUES (?, ?, ?)');
        stmt.run(tnaCode, visitor_id, 'ACTIVE');

        res.status(201).json({ tna_code: tnaCode });
    } catch (err) {
        console.error("TNA Request Error:", err);
        res.status(500).json({ error: "Failed to issue TNA." });
    }
};

/**
 * Get Active TNAs
 * Returns a list of all TNAs currently assigned to the user.
 */
const getActiveTna = (req, res) => {
    const visitor_id = req.params.visitor_id; 
    
    try {
        // Return ALL active TNAs for this visitor as an array
        const rows = db.prepare(`
            SELECT tna_code FROM tnas 
            WHERE visitor_id = ? AND status = 'ACTIVE'
            ORDER BY id DESC
        `).all(visitor_id);
        
        res.json(rows); 
    } catch (err) {
        console.error("Fetch TNA Error:", err);
        res.status(500).json({ error: "Database error" });
    }
};

module.exports = { requestTna, getActiveTna };