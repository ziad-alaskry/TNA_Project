const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');
const tnaController = require('../controllers/tnaController');
const addressController = require('../controllers/addressController');
const bindingController = require('../controllers/bindingController');
const shipmentController = require('../controllers/shipmentController');
const dashboardController = require('../controllers/dashboardController');
const paymentController = require('../controllers/paymentController');
const resolverController = require('../controllers/resolverController');
const personController = require('../controllers/personController');

// Middleware
const { authorize } = require('../middleware/authMiddleware');

// ==========================================
// 1. PUBLIC / AUTH ROUTES
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-security-code', authController.verifySecurityCode);

// ==========================================
// 2. VISITOR ROUTES
// ==========================================
// TNA Management
router.post('/tna/request', authorize(['VISITOR']), tnaController.requestTna);
router.get('/tna/my-tnas', authorize(['VISITOR']), tnaController.getActiveTna);
router.get('/tna/my-summary', authorize(['VISITOR']), tnaController.getTnaSummary);

// Address Discovery & Linking (Realistic UX Flow)
router.get('/marketplace/search', authorize(['VISITOR']), addressController.searchUnits);
router.post('/bindings/link', authorize(['VISITOR']), bindingController.createBinding); // Includes Fee Logic
router.post('/bindings/unlink', authorize(['VISITOR']), bindingController.unlinkBinding); // Includes Transit-Lock

// Visitor Dashboard & Profile
router.get('/dashboard/visitor', authorize(['VISITOR']), dashboardController.getVisitorStats);
router.get('/profile', authorize(['VISITOR', 'OWNER', 'CARRIER']), personController.getMyProfile);
router.get('/logs', authorize(['VISITOR', 'OWNER']), dashboardController.getMasterLogs);

// ==========================================
// 3. OWNER ROUTES
// ==========================================
// Property & Unit Management (Auto-generation logic)
router.post('/addresses/register', authorize(['OWNER']), addressController.registerAddressVariant);
router.get('/addresses/my-properties', authorize(['OWNER']), addressController.getMyProperties);

// Monetization
router.post('/payments/subscribe', authorize(['OWNER', 'VISITOR']), paymentController.processPayment);

// ==========================================
// 4. CARRIER & SYSTEM ROUTES
// ==========================================
// Resolution (TNA -> Physical Unit)
router.post('/resolve', authorize(['CARRIER', 'GOV']), resolverController.resolveTna);

// Shipment Operations
router.post('/shipments/update', authorize(['CARRIER']), shipmentController.updateShipmentStatus);

// ==========================================
// 5. ADMIN / GOV ROUTES
// ==========================================
router.get('/admin/users', authorize(['GOV']), personController.getAllPersons);

module.exports = router;