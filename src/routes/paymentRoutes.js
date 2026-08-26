// backend/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Public webhook endpoint (no auth needed)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Protected payment routes
router.use(auth);
router.post('/create-intent', paymentController.createPaymentIntent);
router.put('/confirm/:bookingId', paymentController.confirmBooking);

module.exports = router;