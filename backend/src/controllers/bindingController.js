const { db } = require('../config/db');

// 1. Create a Binding (Link TNA to address)
const createBinding = (req, res) => {
    const { tna_code, variant_id } = req.body;

    try {
        // 1. Find the TNA
        const tna = db.prepare('SELECT id FROM tnas WHERE tna_code = ?').get(tna_code);
        if (!tna) return res.status(404).json({ error: "TNA code not found." });

        // 2. NEW CHECK: Ensure the PHYSICAL ADDRESS (variant) isn't already occupied by someone else
        const addressOccupied = db.prepare('SELECT id FROM bindings WHERE variant_id = ? AND is_active = 1').get(variant_id);
        if (addressOccupied) {
            return res.status(400).json({ error: "This physical address is already linked to another active TNA." });
        }

        // 3. Check if this specific TNA already has a row in the bindings table
        const existingRow = db.prepare('SELECT id, is_active FROM bindings WHERE tna_id = ?').get(tna.id);

        if (existingRow) {
            // If the TNA is already active elsewhere, we should stop them 
            // (A visitor must unlink from Old Address before linking to New Address)
            if (existingRow.is_active === 1) {
                return res.status(400).json({ error: "This TNA is already active at another address. Unlink first." });
            }

            // 4. REACTIVATE: TNA was unlinked previously, so we update the existing UNIQUE row
            db.prepare(`
                UPDATE bindings 
                SET variant_id = ?, is_active = 1, start_date = CURRENT_TIMESTAMP 
                WHERE tna_id = ?
            `).run(variant_id, tna.id);
        } else {
            // 5. INSERT: Brand new TNA linking for the first time
            db.prepare(`
                INSERT INTO bindings (tna_id, variant_id, is_active) 
                VALUES (?, ?, 1)
            `).run(tna.id, variant_id);
        }

        res.status(201).json({ message: "TNA Linked Successfully!" });
    } catch (err) {
        console.error("Link Error:", err);
        res.status(500).json({ error: "Database error during binding." });
    }
};

// 2. Remove a Binding (Unlink) with Transit-Lock 
const unlinkBinding = (req, res) => {
    const tna_code = req.body.tna_code ? req.body.tna_code.trim().toUpperCase() : "";

    try {
        const tna = db.prepare('SELECT id FROM tnas WHERE tna_code = ?').get(tna_code);
        if (!tna) return res.status(404).json({ error: "TNA code not recognized." });

        // TRANSIT-LOCK
        const activeShipment = db.prepare(`
            SELECT tracking_number FROM shipments
            WHERE tna_id = ? AND status = 'IN_TRANSIT'
        `).get(tna.id);

        if (activeShipment) {
            return res.status(403).json({
                error: `Unlinking blocked. Shipment ${activeShipment.tracking_number} is in-transit.`
            }); 
        }

        // SOFT DELETE (Sets is_active to 0)
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