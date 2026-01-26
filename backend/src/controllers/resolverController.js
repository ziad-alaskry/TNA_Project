const { db } = require('../config/db');
const { isValidTna } = require('../utils/tnaGenerator');

/**
 * TNA Resolution Logic
 * Converts a TNA code into a physical address for Carriers.
 */
const resolveTna = (req, res) => {
    const { tna_code } = req.body;

    if (!isValidTna(tna_code)) {
        return res.status(400).json({ error: "Invalid TNA format." });
    }

    try {
        // Updated Query: Joins Units and Variants for granular address resolution
        const query = `
            SELECT v.base_address, v.city, v.region, u.unit_identifier, t.status as tna_status
            FROM tnas t
            JOIN bindings b ON t.id = b.tna_id
            JOIN units u ON b.unit_id = u.id
            JOIN na_variants v ON u.variant_id = v.id
            WHERE t.tna_code = ? AND b.is_active = 1 AND t.status = 'ACTIVE'
        `;
        
        const resolution = db.prepare(query).get(tna_code);

        if (!resolution) {
            return res.status(404).json({ 
                error: "Resolution failed", 
                instruction: "RETURN TO SENDER",
                message: "No active physical unit linked to this TNA."
            });
        }

        res.json({
            tna_code: tna_code,
            resolved_address: `${resolution.base_address}, ${resolution.unit_identifier}, ${resolution.city}`,
            region: resolution.region,
            status: "SUCCESS"
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error during resolution." });
    }
};

module.exports = { resolveTna };