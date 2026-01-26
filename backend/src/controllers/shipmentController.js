const { db } = require('../config/db');

exports.updateShipmentStatus = (req, res) => {
    const { tracking_number, tna_code, status } = req.body;
    const carrier_id = req.user.id;

    try {
        const tna = db.prepare('SELECT id, visitor_id FROM tnas WHERE tna_code = ?').get(tna_code);
        if (!tna) return res.status(404).json({ error: "Target TNA not found." });

        const upsertShipment = db.transaction(() => {
            db.prepare(`
                INSERT INTO shipments (tracking_number, tna_id, carrier_id, status)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(tracking_number) DO UPDATE SET status=excluded.status
            `).run(tracking_number, tna.id, carrier_id, status);

            // Notify Visitor via Master Log (Masked Inbox logic)
            db.prepare('INSERT INTO master_log (user_id, action_type, metadata) VALUES (?, "SHIPMENT_UPDATE", ?)')
              .run(tna.visitor_id, JSON.stringify({ tracking_number, status }));
        });

        upsertShipment();
        res.json({ message: `Shipment ${tracking_number} updated to ${status}.` });
    } catch (err) {
        res.status(500).json({ error: "Failed to update shipment." });
    }
};