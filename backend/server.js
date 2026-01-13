const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const {initDb} = require('./src/config/db');
const { seedData } = require('./src/config/seed'); // Import seed
const apiRoutes = require('./src/routes/api');

// Middleware 
app.use(cors()); // enables cors 
app.use(express.json()); // parse incoming JSON resquests
app.use(morgan('dev')); // Logs requests to console 
app.use('/api/v1', apiRoutes); // using routes for {tna.request, createPerson,getAllPerson}

// Initialize DB and Seed
try {
    initDb();
    seedData(); // Run this once to ensure ID 1 exists
} catch (err) {
    console.error("❌ Database initialization error:", err);
}

//  Health Checj Route 
app.get('/api/v1/health', (req,res) => {
    res.status(200).json({status:'UP', message:'API is up and running'});
})

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
})