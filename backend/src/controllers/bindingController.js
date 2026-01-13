const { db } = require('../config/db');

// 1. Create a Binding (Link TNA to address)
const createBinding = (req, res) => {
    const { variant_id } = req.body;
    const tna_code = req.body.tna_code ? req.body.tna_code.trim().toUpperCase() : "";

    try {
        const tna = db.prepare('SELECT id FROM tnas WHERE tna_code = ?').get(tna_code);
        if (!tna) {
            return res.status(404).json({ error: `TNA Code ${tna_code} not found.` });
        }

        const existing = db.prepare('SELECT id FROM bindings WHERE tna_id = ? AND is_active = 1').get(tna.id);
        if (existing) {
            return res.status(400).json({ error: "This TNA is already linked to an address." });
        }

        const stmt = db.prepare('INSERT INTO bindings (tna_id, variant_id) VALUES (?, ?)');
        stmt.run(tna.id, variant_id);

        res.status(201).json({ message: "Binding created successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error during binding." });
    }
};

// 2. Remove a Binding (Unlink) with Transit-Lock 
const unlinkBinding = (req, res) => {
    // We accept tna_code from frontend for consistency
    const tna_code = req.body.tna_code ? req.body.tna_code.trim().toUpperCase() : "";

    try {
        // Find TNA ID first
        const tna = db.prepare('SELECT id FROM tnas WHERE tna_code = ?').get(tna_code);
        if (!tna) return res.status(404).json({ error: "TNA code not recognized." });

        // TRANSIT-LOCK LOGIC: checks for active shipments
        const activeShipment = db.prepare(`
            SELECT tracking_number FROM shipments
            WHERE tna_id = ? AND status = 'IN_TRANSIT'
        `).get(tna.id);

        if (activeShipment) {
            return res.status(403).json({
                error: `Unlinking blocked. Shipment ${activeShipment.tracking_number} is currently in-transit to this TNA.`
            }); 
        }

        // IF no transit, deactivate binding (soft delete)
        const stmt = db.prepare('UPDATE bindings SET is_active = 0 WHERE tna_id = ?');
        const info = stmt.run(tna.id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'No active binding found for this TNA.' });
        }

        res.json({ message: 'Address unlinked successfully.' });
            
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Unlinking process failed.' });
    }
};

module.exports = { createBinding, unlinkBinding };