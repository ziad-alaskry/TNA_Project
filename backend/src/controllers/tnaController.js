const { db } = require('../config/db');
const { generateTnaCode } = require('../utils/tnaGenerator');

exports.requestTna = (req, res) => {
    const visitor_id = req.user.id;

    try {
        const activeCount = db.prepare(`SELECT COUNT(*) as count FROM tnas WHERE visitor_id = ? AND status = 'ACTIVE'`).get(visitor_id);

        if (activeCount.count >= 5) {
            return res.status(400).json({ error: "Limit Reached. You can only have 5 active TNAs." });
        }

        const tnaCode = generateTnaCode();
        // Figma Requirement: TNAs have an expiry (Default 3 months)
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        const insertTna = db.transaction(() => {
            const stmt = db.prepare('INSERT INTO tnas (tna_code, visitor_id, status, expires_at) VALUES (?, ?, ?, ?)');
            const info = stmt.run(tnaCode, visitor_id, 'ACTIVE', expiresAt.toISOString());

            // Generate a 6-digit Security Code (رمز الأمان) per Figma Page 7
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            db.prepare('INSERT INTO tna_secrets (tna_id, otp_code) VALUES (?, ?)').run(info.lastInsertRowid, otp);

            return { tnaCode, otp, expiresAt };
        });

        const result = insertTna();
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to issue TNA with security code." });
    }
};

exports.getActiveTna = (req, res) => {
    const visitor_id = req.user.id;
    try {
        const rows = db.prepare(`SELECT tna_code, status, expires_at FROM tnas WHERE visitor_id = ? ORDER BY id DESC`).all(visitor_id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
};

exports.getTnaSummary = (req, res) => {
    const visitor_id = req.user.id;
    try {
        // Query to get all TNAs for the visitor with their linking status
        const query = `
            SELECT 
                t.id,
                t.tna_code,
                t.status,
                t.expires_at,
                CASE 
                    WHEN b.id IS NOT NULL AND b.is_active = 1 THEN 'Linked'
                    ELSE 'Not Linked'
                END as linking_status,
                u.unit_identifier,
                nv.base_address,
                nv.city,
                nv.region
            FROM tnas t
            LEFT JOIN bindings b ON t.id = b.tna_id AND b.is_active = 1
            LEFT JOIN units u ON b.unit_id = u.id
            LEFT JOIN na_variants nv ON u.variant_id = nv.id
            WHERE t.visitor_id = ?
            ORDER BY t.id DESC
        `;

        const rows = db.prepare(query).all(visitor_id);

        // Format the response
        const summary = rows.map(row => ({
            tna_code: row.tna_code,
            status: row.status,
            linking_status: row.linking_status,
            expires_at: row.expires_at,
            linked_address: row.linking_status === 'Linked' ? {
                unit: row.unit_identifier,
                address: row.base_address,
                city: row.city,
                region: row.region
            } : null
        }));

        res.json(summary);
    } catch (err) {
        console.error('Error fetching TNA summary:', err);
        res.status(500).json({ error: "Failed to retrieve TNA summary" });
    }
};