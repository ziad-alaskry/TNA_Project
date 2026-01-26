const { db } = require('../config/db');

/**
 * Register a Base Property and auto-generate sub-units.
 * Based on Figma: Owner adds a property and specifies capacity.
 */
const registerAddressVariant = (req, res) => {
    const owner_id = req.user.id; 
    const { base_address, city, region, total_units } = req.body; 

    if (!base_address || !city || !region || !total_units) {
        return res.status(400).json({ error: "Incomplete property details." });
    }

    try {
        // Use a Database Transaction to ensure property and units are created together
        const createPropertyAction = db.transaction((ownerId, addr, cty, reg, qty) => {
            const stmt = db.prepare(`
                INSERT INTO na_variants (owner_id, base_address, city, region, total_units_allowed)
                VALUES (?, ?, ?, ?, ?)
            `);
            const info = stmt.run(ownerId, addr, cty, reg, qty);
            const variantId = info.lastInsertRowid;

            // Loop to generate sub-units (e.g., King Rd - UNIT 1)
            const unitStmt = db.prepare(`INSERT INTO units (variant_id, unit_identifier) VALUES (?, ?)`);
            for (let i = 1; i <= qty; i++) {
                unitStmt.run(variantId, `UNIT-${i}`);
            }

            return variantId;
        });

        const newPropertyId = createPropertyAction(owner_id, base_address, city, region, total_units);

        return res.status(201).json({
            id: newPropertyId,
            message: `Property registered with ${total_units} individual units created.`
        });

    } catch (err) {
        console.error("Property Registration Error:", err);
        return res.status(500).json({ error: "Failed to register property and units." });
    }
}

/**
 * Search for available units by City or Region.
 * This satisfies the "Realistic UX" search requirement.
 */
const searchUnits = (req, res) => {
    const { city, region } = req.query;
    try {
        const query = `
            SELECT u.id as unit_id, v.base_address, v.city, v.region, u.unit_identifier
            FROM units u
            JOIN na_variants v ON u.variant_id = v.id
            WHERE u.is_available = 1 
            AND (v.city LIKE ? OR v.region LIKE ?)
        `;
        const rows = db.prepare(query).all(`%${city || ''}%`, `%${region || ''}%`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Search failed." });
    }
};

const getMyProperties = (req, res) => {
    const owner_id = req.user.id; 
    try {
        const rows = db.prepare('SELECT * FROM na_variants WHERE owner_id = ?').all(owner_id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch properties" });
    }
};

module.exports = { registerAddressVariant, searchUnits, getMyProperties };