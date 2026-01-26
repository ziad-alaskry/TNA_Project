const request = require('supertest');
const express = require('express');
// Ensure paths point to the /src directory
const { db, initDb } = require('../src/config/db');
const apiRoutes = require('../src/routes/api');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/v1', apiRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'project_a_secure_dev_key_2026';

describe('Project A - Master Integration Tests', () => {
    let visitorToken, carrierToken, ownerToken;

    beforeAll(async () => {
        initDb(); // Ensure tables exist

        // 1. Create Mock Tokens
        visitorToken = jwt.sign({ id: 1, role: 'VISITOR' }, JWT_SECRET);
        ownerToken = jwt.sign({ id: 2, role: 'OWNER' }, JWT_SECRET);
        carrierToken = jwt.sign({ id: 3, role: 'CARRIER' }, JWT_SECRET);

        // 2. Seed Mandatory Parent Data (Fixes Foreign Key Errors)
        // We need an Owner, a Variant, and a Unit to exist for the Binding tests
        db.prepare("INSERT OR IGNORE INTO persons (id, name, email, password_hash, role) VALUES (1, 'Vis', 'v@t.com', 'hash', 'VISITOR')").run();
        db.prepare("INSERT OR IGNORE INTO persons (id, name, email, password_hash, role) VALUES (2, 'Own', 'o@t.com', 'hash', 'OWNER')").run();
        db.prepare("INSERT OR IGNORE INTO persons (id, name, email, password_hash, role) VALUES (3, 'Car', 'c@t.com', 'hash', 'CARRIER')").run();
        
        db.prepare("INSERT OR IGNORE INTO na_variants (id, owner_id, base_address, city, region) VALUES (1, 2, '123 Tech St', 'Riyadh', 'Central')").run();
        db.prepare("INSERT OR IGNORE INTO units (id, variant_id, unit_identifier, is_available) VALUES (1, 1, 'UNIT-A', 1)").run();
    });

    describe('Constraint: Max 5 TNAs', () => {
        it('should block a visitor from requesting a 6th TNA', async () => {
            // Seed 5 TNAs for user 1
            const stmt = db.prepare('INSERT INTO tnas (tna_code, visitor_id, status) VALUES (?, ?, ?)');
            for(let i=1; i<=5; i++) {
                stmt.run(`TNA-TEST000${i}`, 1, 'ACTIVE');
            }

            const res = await request(app)
                .post('/api/v1/tna/request')
                .set('Authorization', `Bearer ${visitorToken}`);
            
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Limit Reached');
        });
    });

    describe('Constraint: Transit-Lock Logic', () => {
        it('should block unlinking if an active shipment exists', async () => {
            // 1. Create a TNA and a Binding (linked to Unit 1 created in beforeAll)
            db.prepare("INSERT INTO tnas (id, tna_code, visitor_id) VALUES (99, 'TNA-LOCK1234', 1)").run();
            db.prepare("INSERT INTO bindings (tna_id, unit_id, is_active) VALUES (99, 1, 1)").run();
            
            // 2. Add an IN_TRANSIT shipment
            db.prepare("INSERT INTO shipments (tracking_number, tna_id, carrier_id, status) VALUES ('TRK-LOCK', 99, 3, 'IN_TRANSIT')").run();

            // 3. Attempt to unlink
            const res = await request(app)
                .post('/api/v1/bindings/unlink')
                .set('Authorization', `Bearer ${visitorToken}`)
                .send({ tna_code: 'TNA-LOCK1234' });

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Operations Active');
        });

        it('should allow unlinking if shipment is DELIVERED', async () => {
            db.prepare("UPDATE shipments SET status = 'DELIVERED' WHERE tracking_number = 'TRK-LOCK'").run();

            const res = await request(app)
                .post('/api/v1/bindings/unlink')
                .set('Authorization', `Bearer ${visitorToken}`)
                .send({ tna_code: 'TNA-LOCK1234' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Address unlinked successfully.');
        });
    });

    describe('Security: Role-Based Access Control', () => {
        it('should prevent a Visitor from resolving a TNA (Carrier only)', async () => {
            const res = await request(app)
                .post('/api/v1/resolve')
                .set('Authorization', `Bearer ${visitorToken}`)
                .send({ tna_code: 'TNA-LOCK1234' });

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Access Restricted');
        });
    });

    describe('Data Integrity: Sub-Unit Availability', () => {
        it('should block linking to a unit that is already occupied', async () => {
            // Ensure Unit 1 exists and set it to unavailable
            db.prepare("UPDATE units SET is_available = 0 WHERE id = 1").run();

            const res = await request(app)
                .post('/api/v1/bindings/link')
                .set('Authorization', `Bearer ${visitorToken}`)
                .send({ tna_code: 'TNA-LOCK1234', unit_id: 1 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Address unit is unavailable.');
        });
    });
});

//npx jest tests/integration.test.js --runInBand