// Telling Express how to reach functionalities 
const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const tnaController = require('../controllers/tnaController');
const addressController = require('../controllers/addressController');
const bindingController = require('../controllers/bindingController');
const resolverController = require('../controllers/resolverController')
const shipmentController = require('../controllers/shipmentController')
const authController = require('../controllers/authController')
const {authorize} = require('../middleware/authMiddleware')


// Person Routes 
router.post('/persons', personController.createPerson);
router.get('/persons', personController.getAllPersons);

// TNA Routes 
router.post('/tna/request', tnaController.requestTna);
router.get('/tna/active/:visitor_id', tnaController.getActiveTna);

// Address Routes
router.post('/addresses/register',addressController.registerAddressVariant);
router.get('/addresses/owner/:owner_id', addressController.getOWnerAddresses);

// Binding Routes
router.post('/bindings/link', bindingController.createBinding);
router.post('/binding/unlink', bindingController.unlinkBinding);

// Carrier Routes
router.post('/resolve', resolverController.resolveTna);
router.post('/shipments/update', shipmentController.updateShipmentStatus);

// Auth Routes (Public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login); 

// Visitor Only
router.post('/tna/request', authorize(['VISITOR']), tnaController.requestTna);
router.post('/bindings/unlink', authorize(['VISITOR']), bindingController.unlinkBinding);

// Owner Only
router.post('/addresses/register', authorize(['OWNER']), addressController.registerAddressVariant);
router.post('/bindings/link', authorize(['OWNER']), bindingController.createBinding);

// Carrier Only
router.post('/resolve', authorize(['CARRIER']), resolverController.resolveTna);
router.post('/shipments/update', authorize(['CARRIER']), shipmentController.updateShipmentStatus);

module.exports = router;