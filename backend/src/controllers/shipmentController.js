const { db } = require('../config/db');

const updateShipmentStatus = (req, res) => {
    // Normalizing inputs
    const tracking_number = req.body.tracking_number?.trim();
    const tna_code = req.body.tna_code?.trim().toUpperCase();
    const status = req.body.status || 'IN_TRANSIT'; // Default to IN_TRANSIT if not provided

    if (!tracking_number || !tna_code) {
        return res.status(400).json({ error: "Tracking number and TNA code are required." });
    }

    try {
        // 1. Find TNA ID from code
        const tna = db.prepare('SELECT id FROM tnas WHERE tna_code = ?').get(tna_code);
        if (!tna) {
            return res.status(404).json({ error: `TNA ${tna_code} not found.` });
        }

        // 2. Upsert Shipment
        // This handles creating a new shipment OR updating an existing tracking number's status
        const stmt = db.prepare(`
            INSERT INTO shipments (tracking_number, tna_id, status)
            VALUES (?, ?, ?)
            ON CONFLICT(tracking_number) DO UPDATE SET status=excluded.status
        `);
        
        stmt.run(tracking_number, tna.id, status);

        console.log(`🚚 Shipment ${tracking_number}: Status set to ${status} for TNA ${tna_code}`);

        res.json({ 
            message: `Shipment ${tracking_number} is now ${status}.`,
            lock_active: status === 'IN_TRANSIT' 
        });
    } catch (err) {
        console.error("Shipment Update Error:", err.message);
        res.status(500).json({ error: "Failed to process shipment status." });
    }
};

module.exports = { updateShipmentStatus };