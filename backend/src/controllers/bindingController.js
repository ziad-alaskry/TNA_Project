const { db } = require('../config/db');

exports.createBinding = (req, res) => {
    const { tna_code, unit_id } = req.body;
    const userId = req.user.id;

    try {
        // 1. Verify TNA ownership
        const tna = db.prepare('SELECT id FROM tnas WHERE tna_code = ? AND visitor_id = ?').get(tna_code, userId);
        if (!tna) return res.status(404).json({ error: "TNA not found or unauthorized." });

        // 2. Check if Unit exists and is available
        const unit = db.prepare('SELECT is_available FROM units WHERE id = ?').get(unit_id);
        if (!unit) return res.status(404).json({ error: "Unit not found." });
        if (!unit.is_available) return res.status(400).json({ error: "Address unit is unavailable." });

        const performBinding = db.transaction(() => {
            // A. Mark unit as occupied
            db.prepare('UPDATE units SET is_available = 0 WHERE id = ?').run(unit_id);
            
            // B. Clean up any existing binding for this TNA
            db.prepare('DELETE FROM bindings WHERE tna_id = ?').run(tna.id);
            
            // C. Create New Binding
            db.prepare('INSERT INTO bindings (tna_id, unit_id, is_active) VALUES (?, ?, 1)').run(tna.id, unit_id);
            
            // D. Record One-Time Fee - Fixed with single quotes
            db.prepare("INSERT INTO transactions (user_id, amount, type) VALUES (?, 5.00, 'LINK_FEE')").run(userId);
            
            // E. Audit Log entry - Fixed with single quotes
            db.prepare("INSERT INTO master_log (user_id, action_type, metadata) VALUES (?, 'BIND', ?)")
              .run(userId, JSON.stringify({ tna_code, unit_id, fee: 5.00 }));
        });

        performBinding();
        res.status(201).json({ message: "TNA Linked Successfully (Fee Processed)." });
    } catch (err) {
        console.error("Binding Error:", err);
        res.status(500).json({ error: "Binding failed due to internal error." });
    }
};

exports.unlinkBinding = (req, res) => {
    const { tna_code } = req.body;
    const visitor_id = req.user.id;

    try {
        const tna = db.prepare('SELECT id FROM tnas WHERE tna_code = ? AND visitor_id = ?').get(tna_code, visitor_id);
        
        if (!tna) {
            return res.status(404).json({ error: 'TNA not found or unauthorized.' });
        }

        // TRANSIT-LOCK CHECK
        const activeShipment = db.prepare(`
            SELECT tracking_number FROM shipments 
            WHERE tna_id = ? AND status IN ('PENDING', 'IN_TRANSIT')
        `).get(tna.id);

        if (activeShipment) {
            return res.status(403).json({ 
                error: 'Operations Active: Cannot unlink address while a shipment is in transit.' 
            });
        }

        const performUnlink = db.transaction(() => {
            const currentBinding = db.prepare('SELECT unit_id FROM bindings WHERE tna_id = ? AND is_active = 1').get(tna.id);
            
            if (currentBinding) {
                db.prepare('UPDATE units SET is_available = 1 WHERE id = ?').run(currentBinding.unit_id);
                db.prepare('UPDATE bindings SET is_active = 0 WHERE tna_id = ?').run(tna.id);
                
                // Audit Log entry - Fixed with single quotes
                db.prepare("INSERT INTO master_log (user_id, action_type, metadata) VALUES (?, 'UNLINK', ?)")
                  .run(visitor_id, JSON.stringify({ tna_code }));
            }
        });

        performUnlink();
        return res.status(200).json({ message: 'Address unlinked successfully.' });
    } catch (err) {
        console.error("Unlink Error:", err);
        return res.status(500).json({ error: 'Internal server error during unlinking.' });
    }
};