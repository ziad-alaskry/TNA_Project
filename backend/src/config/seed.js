const { db } = require('./db');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('Skipping seeding in production environment');
      return;
    }
    console.log("🌱 Seeding database for Realistic UX testing...");

    // 1. Clear existing data in CORRECT ORDER (Child to Parent)
    db.prepare('DELETE FROM tna_secrets').run();
    db.prepare('DELETE FROM bindings').run();
    db.prepare('DELETE FROM units').run();
    db.prepare('DELETE FROM na_variants').run();
    db.prepare('DELETE FROM tnas').run();
    db.prepare('DELETE FROM persons').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('persons', 'tnas', 'na_variants', 'units', 'bindings', 'tna_secrets')").run();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 2. Create an OWNER
    const ownerStmt = db.prepare('INSERT INTO persons (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const ownerInfo = ownerStmt.run('Real Estate Co', 'owner@test.com', hashedPassword, 'OWNER');
    const ownerId = ownerInfo.lastInsertRowid;

    // 3. Create a VISITOR (You)
    db.prepare('INSERT INTO persons (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run('Test Visitor', 'visitor@test.com', hashedPassword, 'VISITOR');

    // 4. Create a Physical Property (Variant)
    const variantStmt = db.prepare('INSERT INTO na_variants (owner_id, base_address, city, region) VALUES (?, ?, ?, ?)');
    const variantInfo = variantStmt.run(ownerId, '123 Tech Tower', 'Riyadh', 'Central');
    const variantId = variantInfo.lastInsertRowid;

    // 5. Create an Available Unit (This is what was missing!)
    db.prepare('INSERT INTO units (variant_id, unit_identifier, is_available) VALUES (?, ?, ?)')
      .run(variantId, 'UNIT-101', 1);

    console.log("✅ Database Seeded: Visitor, Owner, and Unit #1 are ready.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  }
};

module.exports = { seedData };