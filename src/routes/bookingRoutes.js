// backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { validate, schemas } = require('../middleware/validate');

// All booking routes require authentication
router.use(auth);

// Booking CRUD
router.post(
    '/',
    validate(schemas.createBooking),
    bookingController.createBooking
);

router.get('/', bookingController.getUserBookings);
router.get('/:id', bookingController.getBookingById);
router.put('/:id/cancel', bookingController.cancelBooking);

// Admin only routes
router.put(
    '/:id/status',
    admin,
    validate(schemas.updateBookingStatus),
    bookingController.updateBookingStatus
);

module.exports = router;