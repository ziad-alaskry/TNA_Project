/**
 * This controller handles the logic of taking a base National Address,
 *  appending a 4-letter suffix to create a unique "NA Variant.
 */

const {db} = require('../config/db');

const registerAddressVariant = (req,res) => {
    const { owner_id, base_address, suffix } = req.body; 

    // STABILITY CHECK: Ensure base_address exists
    if (!base_address || base_address === "undefined") {
        return res.status(400).json({ error: "Base address is required and cannot be undefined." });
    }
    
    // Validation: Suffix must be 4 character (e.g., UNIT, ROOM, B101)
    if(!suffix || suffix.length !== 4) {
        return res.status(400).json({error: 'Suffix must be exactly 4 characters.'})
    } 
    try{
    // 1. Verify the person is an OWNER
    const person = db.prepare('SELECT role FROM persons WHERE id = ?').get(owner_id);
    if(!person || person.role !== 'OWNER'){
        res.status(403).json({error: 'Only owners can register adress variants.'})
    }

    // 2. Construct the full proxy address (e.g., 1234 King Rd - UNIT)
    const full_address = `${base_address} - ${suffix.toUpperCase()}`;
    // 3. Save to db 
    const stmt = db.prepare(`
        INSERT INTO na_variants (owner_id, base_address, suffix , full_address)
        VALUES (?,?,?,?)
        `);
    const info = stmt.run(owner_id,base_address,suffix.toUpperCase() ,full_address);
    res.status(201).json({
        id: info.lastInsertRowid,
        full_address: full_address,
        message: 'Address variant registered successfully.'
    });
    }catch(err) {
        console.error("DB Error:", err);
        res.status(500).json({ error: "Database error during registration." });
    }
}

const getOWnerAddresses = (req,res) => {
    const {owner_id} = req.params;
    const rows = db.prepare('SELECT * FROM na_variants WHERE owner_id = ?').all(owner_id);
    res.json(rows);
}

const getMyProperties = (req, res) => {
    const owner_id = req.user.id; // From JWT
    try {
        const rows = db.prepare('SELECT * FROM na_variants WHERE owner_id = ?').all(owner_id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch properties" });
    }
};

module.exports = {registerAddressVariant, getOWnerAddresses, getMyProperties};