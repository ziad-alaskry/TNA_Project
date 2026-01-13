// Telling Express how to reach functionalities 
const express = require('express');
const router = express.Router();

// Controllers
const tnaController = require('../controllers/tnaController');
const addressController = require('../controllers/addressController');
const bindingController = require('../controllers/bindingController');
const resolverController = require('../controllers/resolverController');
const shipmentController = require('../controllers/shipmentController');
const authController = require('../controllers/authController');

// Middleware
const { authorize } = require('../middleware/authMiddleware');

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login); 

// ==========================================
// VISITOR ROUTES (Role-Protected)
// ==========================================
// Request a new TNA (Enforces Max 5 logic in controller)
router.post('/tna/request', authorize(['VISITOR']), tnaController.requestTna);

// Fetch all active TNAs for the logged-in visitor
router.get('/tna/active/:visitor_id', authorize(['VISITOR']), tnaController.getActiveTna);

// Remove link between TNA and physical address
router.post('/bindings/unlink', authorize(['VISITOR']), bindingController.unlinkBinding);

// ==========================================
// OWNER ROUTES (Role-Protected)
// ==========================================
// Register a new address variant (e.g., Unit 101)
router.post('/addresses/register', authorize(['OWNER']), addressController.registerAddressVariant);

// Get list of properties owned by the logged-in user
router.get('/addresses/my-properties', authorize(['OWNER']), addressController.getMyProperties);

// Link a Visitor's TNA to an Owner's address variant
router.post('/bindings/link', authorize(['OWNER']), bindingController.createBinding);

// ==========================================
// CARRIER ROUTES (Role-Protected)
// ==========================================
// Convert TNA code to physical destination
router.post('/resolve', authorize(['CARRIER']), resolverController.resolveTna);

// Update shipment status (Triggers Transit-Lock)
router.post('/shipments/update', authorize(['CARRIER']), shipmentController.updateShipmentStatus);

module.exports = router;