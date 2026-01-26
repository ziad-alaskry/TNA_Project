const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if(!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, "project_a.db"), { verbose: console.log });
db.pragma('foreign_keys = ON');

const initDb = () => {
    const schema = `
        -- 1. Persons: Updated for Figma Registration (ID & Mobile)
        CREATE TABLE IF NOT EXISTS persons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('VISITOR', 'OWNER', 'CARRIER', 'BUSINESS', 'GOV')) NOT NULL,
            document_number TEXT,
            document_type TEXT,
            mobile TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. TNAs: Added Expiry (Standard for "Temporary" addresses)
        CREATE TABLE IF NOT EXISTS tnas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tna_code TEXT UNIQUE NOT NULL,
            visitor_id INTEGER NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            expires_at DATETIME,
            FOREIGN KEY (visitor_id) REFERENCES persons(id)
        );

        -- 3. NA Variants: Physical addresses (Property Level)
        CREATE TABLE IF NOT EXISTS na_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            base_address TEXT NOT NULL,
            city TEXT NOT NULL,
            region TEXT NOT NULL,
            total_units_allowed INTEGER DEFAULT 1,
            FOREIGN KEY (owner_id) REFERENCES persons(id)
        );

        -- 4. Units: Sub-addresses (e.g. Suite 101, UNIT-A)
        CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            variant_id INTEGER NOT NULL,
            unit_identifier TEXT NOT NULL,
            is_available BOOLEAN DEFAULT 1,
            FOREIGN KEY (variant_id) REFERENCES na_variants(id)
        );

        -- 5. Bindings: 1-to-1 active link between TNA and Unit
        CREATE TABLE IF NOT EXISTS bindings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tna_id INTEGER UNIQUE NOT NULL,
            unit_id INTEGER NOT NULL,
            linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (tna_id) REFERENCES tnas(id),
            FOREIGN KEY (unit_id) REFERENCES units(id)
        );

        -- 6. Shipments: Transit Lock Logic
        CREATE TABLE IF NOT EXISTS shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_number TEXT UNIQUE NOT NULL,
            tna_id INTEGER NOT NULL,
            carrier_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('PENDING', 'IN_TRANSIT', 'DELIVERED')) NOT NULL,
            FOREIGN KEY (tna_id) REFERENCES tnas(id),
            FOREIGN KEY (carrier_id) REFERENCES persons(id)
        );

        -- 7. Transactions: Monetization (Subscriptions & Link Fees)
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            type TEXT CHECK(type IN ('LINK_FEE', 'SUBSCRIPTION')) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES persons(id)
        );

        -- 8. Master Log: Centralized Audit Trail
        CREATE TABLE IF NOT EXISTS master_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,
            metadata TEXT, -- JSON string for details
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES persons(id)
        );
    `;
    db.exec(schema);
    db.exec(`
    CREATE TABLE IF NOT EXISTS tna_secrets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tna_id INTEGER UNIQUE NOT NULL,
        otp_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tna_id) REFERENCES tnas(id)
    );
`);
    console.log("✅ Database and Schema initialized with Units and Audit Logs.");
};

module.exports = { db, initDb };