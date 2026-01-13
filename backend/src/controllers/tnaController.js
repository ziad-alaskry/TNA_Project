const {db} = require('../config/db');
const {generateTnaCode} = require('../utils/tnaGenerator');

const requestTna = (req,res) => {
// 1. Force conversion to Integer to handle "1.0" or string issues
    const visitor_id = parseInt(req.body.visitor_id);

        try {
        // 2. Query the database first
        const person = db.prepare('SELECT role FROM persons WHERE id = ?').get(visitor_id);
        
        // 3. NOW check if the result exists
        if (!person) {
            console.log(`⚠️ Visitor ID ${visitor_id} not found.`);
            return res.status(404).json({ error: "Visitor ID not found in database." });
        }

        // 4. Validate role
        if (person.role !== 'VISITOR') {
            return res.status(403).json({ error: "Only visitors can request a TNA" });
        }

        // 5. Success Path: Generate and Insert
        const tnaCode = generateTnaCode();
        const stmt = db.prepare('INSERT INTO tnas (tna_code, visitor_id) VALUES (?, ?)');
        stmt.run(tnaCode, visitor_id);

        console.log(`✅ TNA Issued: ${tnaCode} for Visitor ${visitor_id}`);
        res.status(201).json({ tna_code: tnaCode });

    } catch (err) {
        console.error("❌ Internal Logic Error:", err);
        res.status(500).json({ error: "Database error during TNA issuance" });
    }
};

const getActiveTna = (req, res) => {
    const { visitor_id } = req.params;
    try {
        // We sort by id DESC to get the most recent TNA issued to this visitor
        const row = db.prepare(`
            SELECT tna_code FROM tnas 
            WHERE visitor_id = ? 
            ORDER BY id DESC LIMIT 1
        `).get(visitor_id);
        
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "No TNA found" });
        }
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ error: "Database error" });
    }
};

module.exports = { requestTna, getActiveTna };

