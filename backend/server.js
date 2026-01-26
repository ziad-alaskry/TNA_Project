const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs'); // New: to parse the YAML file
const path = require('path');
require('dotenv').config();

const app = express();
module.exports = app;

const PORT = process.env.PORT || 5000;
const { initDb } = require('./src/config/db');
const { seedData } = require('./src/config/seed');
const apiRoutes = require('./src/routes/api');

// Middleware 
app.use(cors()); 
app.use(express.json()); 
app.use(morgan('dev')); 

// API Routes
app.use('/api/v1', apiRoutes);

// --- NEW SWAGGER SETUP ---
try {
    // Load the static YAML file from your docs folder
    const swaggerDocument = YAML.load(path.join(__dirname, './src/docs/openapi.yaml'));

    // Serve Swagger UI using the YAML file
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: "Project TNA - Documentation",
        swaggerOptions: {
            persistAuthorization: true, // Keeps your JWT token even if you refresh the page
        }
    }));
    console.log(`📖 Swagger Docs available at http://localhost:${PORT}/api-docs`);
} catch (error) {
    console.error("❌ Failed to load Swagger documentation:", error.message);
}
// --------------------------

// Initialize DB and Seed
try {
    initDb();
    seedData(); 
} catch (err) {
    console.error("❌ Database initialization error:", err);
}

// Health Check Route 
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'API is up and running' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server started on http://localhost:${PORT}`);
    });
}