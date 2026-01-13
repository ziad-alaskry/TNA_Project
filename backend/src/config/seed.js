const { db } = require('./db');

const seedData = () => {
    try {
        console.log("🌱 Seeding database with test users...");

        const insertPerson = db.prepare(`
            INSERT OR IGNORE INTO persons (id, name, role, id_number) 
            VALUES (?, ?, ?, ?)
        `);

        // Create 1 Visitor, 1 Owner, 1 Carrier
        insertPerson.run(1, 'John Visitor', 'VISITOR', 'V12345');
        insertPerson.run(2, 'Sarah Owner', 'OWNER', 'O67890');
        insertPerson.run(3, 'Fast Delivery Co', 'CARRIER', 'C11223');

        console.log("✅ Seed complete: Test users created.");
    } catch (err) {
        console.error("❌ Seeding failed:", err);
    }
};

module.exports = { seedData };