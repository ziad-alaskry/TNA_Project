const { db } = require('../config/db');
const { isValidTna } = require('../utils/tnaGenerator');

const resolveTna = (req, res) => {
    const { tna_code } = req.body;

    // 1. Validate TNA Format
    if (!isValidTna(tna_code)) {
        return res.status(400).json({ error: "Invalid TNA format. Expected TNA-XXXX1234$" });
    }

    try {
        // 2. Query the active binding and the associated address
        const resolution = db.prepare(`
            SELECT v.full_address, b.is_active, t.status as tna_status
            FROM tnas t
            JOIN bindings b ON t.id = b.tna_id
            JOIN na_variants v ON b.variant_id = v.id
            WHERE t.tna_code = ? AND b.is_active = 1 AND t.status = 'ACTIVE'
        `).get(tna_code);

        if (!resolution) {
            return res.status(404).json({ 
                error: "Resolution failed", 
                instruction: "RETURN TO SENDER",
                message: "No active physical address linked to this TNA."
            });
        }

        res.json({
            tna_code: tna_code,
            physical_address: resolution.full_address,
            status: "SUCCESS"
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error during resolution." });
    }
};

module.exports = { resolveTna };