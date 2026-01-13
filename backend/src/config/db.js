const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs')

//  to ensure the data directory exists 
const dataDir = path.join(__dirname, '../../data');
if(!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// connect to (or create) SQLite db file 
const db = new Database(path.join(dataDir, "project_a.db"), {verbose: console.log });

// Enable Enable Foreign-key support 
db.pragma('foreign_keys = ON');

/**
 * SCHEMA INITIALIZATION 
 * Connects directly to the requirements 
 * if anything added to the requirements , I ENJECT HERE 
 */
const initDb = () => {
    const schema = `
        -- 1. Persons: Stores Visitors, Owners, and Carriers
        CREATE TABLE IF NOT EXISTS persons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT CHECK(role IN ('VISITOR', 'OWNER', 'CARRIER')) NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            id_number TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. TNAs: The Temporary National Address IDs
        CREATE TABLE IF NOT EXISTS tnas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tna_code TEXT UNIQUE NOT NULL, -- Format: TNA-XXXX1234$
            visitor_id INTEGER NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            FOREIGN KEY (visitor_id) REFERENCES persons(id)
        );

        -- We also need to ensure TNAs have an 'is_active' status 
        -- so we can enforce the "Max 5" rule easily.
        

        -- 3. NA Variants: Physical addresses + 4-letter suffix
        CREATE TABLE IF NOT EXISTS na_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            base_address TEXT NOT NULL,
            suffix TEXT NOT NULL, -- The 4-letter suffix (e.g. ROOM)
            full_address TEXT NOT NULL,
            is_available BOOLEAN DEFAULT 1,
            FOREIGN KEY (owner_id) REFERENCES persons(id)
        );

        -- 4. Bindings: The link between TNA and Physical Address
        CREATE TABLE IF NOT EXISTS bindings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tna_id INTEGER UNIQUE NOT NULL,
                -- Ensure 1-to-1 active rule
                -- enforces rule that a TNA cannot be bound to two different addresses at once
            variant_id INTEGER NOT NULL,
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (tna_id) REFERENCES tnas(id),
            FOREIGN KEY (variant_id) REFERENCES na_variants(id)
        );

        -- 5. Shipments: Used for the Transit Lock logic
        CREATE TABLE IF NOT EXISTS shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_number TEXT UNIQUE NOT NULL,
            tna_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('PENDING', 'IN_TRANSIT', 'DELIVERED')) NOT NULL,
            FOREIGN KEY (tna_id) REFERENCES tnas(id)
        );
    `;
    db.exec(schema);
    console.log("DataBase and Schema initialized");
};

module.exports = {db,initDb};
