const request = require('supertest');
const app = require('../server'); 
const { db } = require('../src/config/db');

describe('Project A - Integration Tests', () => {
  let visitorToken, ownerToken;
  let visitorId, testTnaCode, variantId;

  // CLEANUP: Wipe test users and data before starting
beforeAll(() => {
    db.pragma('foreign_keys = OFF');
    db.prepare("DELETE FROM shipments").run();
    db.prepare("DELETE FROM bindings").run();
    db.prepare("DELETE FROM tnas").run();
    db.prepare("DELETE FROM na_variants").run();
    db.prepare("DELETE FROM persons WHERE email LIKE '%@test.com'").run();
    db.pragma('foreign_keys = ON');
  });

  describe('Auth System', () => {
    it('should register a new Visitor', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: "Test Visitor",
          email: "visitor@test.com",
          password: "password123",
          role: "VISITOR",
          id_number: "V-INTEG-001"
        });
      expect(res.statusCode).toBe(201);
      visitorId = res.body.userId;
    });

    it('should login and return a JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: "visitor@test.com", password: "password123" });
      
      expect(res.statusCode).toBe(200);
      visitorToken = res.body.token;
    });
  });

  describe('TNA Management', () => {
    it('should allow a visitor to request a TNA', async () => {
      const res = await request(app)
        .post('/api/v1/tna/request')
        .set('Authorization', `Bearer ${visitorToken}`);
      
      expect(res.statusCode).toBe(201);
      testTnaCode = res.body.tna_code;
    });

    it('should enforce the Max 5 TNAs rule', async () => {
      // We already have 1 from the previous test. Add 4 more.
      for(let i=0; i<4; i++) {
        await request(app).post('/api/v1/tna/request')
          .set('Authorization', `Bearer ${visitorToken}`);
      }
      
      // The 6th should fail
      const res = await request(app)
        .post('/api/v1/tna/request')
        .set('Authorization', `Bearer ${visitorToken}`);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Limit Reached/i);
    });
  });

  describe('Binding System', () => {
    it('should allow an owner to link a visitor TNA', async () => {
      // 1. Create Owner
      await request(app).post('/api/v1/auth/register').send({
        name: "Test Owner", email: "owner@test.com", password: "password", role: "OWNER", id_number: "O-INTEG-001"
      });
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: "owner@test.com", password: "password"
      });
      ownerToken = loginRes.body.token;

      // 2. Create Property
      await request(app).post('/api/v1/addresses/register')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ base_address: "Integration St", suffix: "TEST" });
      
      const variant = db.prepare('SELECT id FROM na_variants WHERE suffix = ?').get('TEST');
      variantId = variant.id;

      // 3. Link
      const res = await request(app)
        .post('/api/v1/bindings/link')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ tna_code: testTnaCode, variant_id: variantId });

      expect(res.statusCode).toBe(201);
    });
  });

  
describe('Transit-Lock System', () => {
    it('should block unlinking if a shipment is IN_TRANSIT', async () => {
      // 1. Dynamically get the TNA ID for the code we generated earlier
      const tnaRecord = db.prepare('SELECT id FROM tnas WHERE tna_code = ?').get(testTnaCode);
      const actualTnaId = tnaRecord.id;

      // 2. Insert a shipment using the CORRECT dynamic ID
      db.prepare(`
        INSERT INTO shipments (tracking_number, tna_id, status) 
        VALUES (?, ?, 'IN_TRANSIT')
      `).run('TRK-999', actualTnaId); 

      // 3. Try to unlink
      const res = await request(app)
        .post('/api/v1/bindings/unlink')
        .set('Authorization', `Bearer ${visitorToken}`)
        .send({ tna_code: testTnaCode });

      // 4. Expect rejection
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("blocked");
      expect(res.body.error).toContain("TRK-999");
    });
  });

});

// npx jest tests/integration.test.js --runInBand