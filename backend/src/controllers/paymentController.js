const { db } = require('../config/db');

/**
 * POST /api/v1/payments/checkout
 * Simulates a payment. Records a transaction and updates the audit log.
 */
exports.processPayment = (req, res) => {
    const { amount, type, metadata } = req.body; // type: 'LINK_FEE' or 'SUBSCRIPTION'
    const userId = req.user.id;

    const insertTransaction = db.prepare(`
        INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)
    `);

    const insertLog = db.prepare(`
        INSERT INTO master_log (user_id, action_type, metadata) VALUES (?, ?, ?)
    `);

    try {
        // Use a transaction for atomic operation
        const transaction = db.transaction(() => {
            insertTransaction.run(userId, amount, type);
            insertLog.run(userId, 'PAYMENT', JSON.stringify({ amount, type, ...metadata }));
        });

        transaction();
        res.status(200).json({ message: "Payment processed successfully", status: "PAID" });
    } catch (err) {
        res.status(500).json({ error: "Payment processing failed" });
    }
};