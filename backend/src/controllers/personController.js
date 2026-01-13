/**
 * handles creating the users(Visitor, Owner or Carrier), 
 * complex Login skipped; just use an id_number.
 */

const {db} = require('../config/db');

// Create a new person (Visitor, Owner, Carrier)
const createPerson = (req, res) => {
    const {name, role, id_number} = req.body;  
    try {
        const stmt = db.prepare('INSERT INTO persons (name, role, id_number) VALUES (?, ?, ?)');
        const info = stmt.run(name, role, id_number);
        res.status(201).json({id: info.lastInsertRowid, message:"Person created successfully"});
    } catch(err) {
        res.status(400).json({error: "Id Number already exists or invalid data"});
    }
}

// get all persons (for testing dashboard) 
const getAllPersons = (req,res) => {
    const rows = db.prepare('SELECT * FROM persons').all();
    res.json(rows);
};

module.exports = {createPerson, getAllPersons}