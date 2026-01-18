const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerDef = require('./src/docs/swaggerDef');
require('dotenv').config();

const app = express();
module.exports = app;

const PORT = process.env.PORT || 5000;
const {initDb} = require('./src/config/db');
const { seedData } = require('./src/config/seed'); // Import seed
const apiRoutes = require('./src/routes/api');

// Middleware 
app.use(cors()); // enables cors 
app.use(express.json()); // parse incoming JSON resquests
app.use(morgan('dev')); // Logs requests to console 
app.use('/api/v1', apiRoutes); // using routes for {tna.request, createPerson,getAllPerson}

// 1. Setup Swagger Options
const swaggerOptions = {
  swaggerDefinition: swaggerDef,
  // Path to the files where JSDoc comments are written
  apis: ['./src/routes/api.js', './src/docs/schemas.js'], 
};

// 2. Initialize swagger-jsdoc
const specs = swaggerJsdoc(swaggerOptions);

// 3. Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customSiteTitle: "Project A - Documentation",
    swaggerOptions: {
        persistAuthorization: true, // This saves the JWT token so it doesn't disappear on refresh
    }
}));

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

if(require.main === module) {

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
})

}