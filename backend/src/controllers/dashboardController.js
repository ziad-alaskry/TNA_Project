const { db } = require('../config/db');

/**
 * GET /api/v1/dashboard/visitor
 * Fetches total TNAs and active shipment counts for the visitor.
 */
exports.getVisitorStats = (req, res) => {
    const visitorId = req.user.id;
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM tnas WHERE visitor_id = ?) as total_tnas,
            (SELECT COUNT(*) FROM shipments s 
             JOIN tnas t ON s.tna_id = t.id 
             WHERE t.visitor_id = ? AND s.status IN ('PENDING', 'IN_TRANSIT')) as active_operations
    `;

    try {
        const stats = db.prepare(query).get(visitorId, visitorId);
        res.status(200).json(stats);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};

/**
 * GET /api/v1/logs
 * Fetches the master audit trail for the logged-in user.
 */
exports.getMasterLogs = (req, res) => {
    const userId = req.user.id;
    const query = `SELECT action_type, metadata, created_at FROM master_log WHERE user_id = ? ORDER BY created_at DESC`;

    try {
        const logs = db.prepare(query).all(userId);
        // Parse metadata JSON strings back to objects for the frontend
        const parsedLogs = logs.map(log => ({
            ...log,
            metadata: JSON.parse(log.metadata || '{}')
        }));
        res.status(200).json(parsedLogs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch audit logs" });
    }
};