// backend/src/routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', roomController.getAllRooms);
router.get('/types', roomController.getRoomTypes);
router.get('/:id', roomController.getRoomById);
router.get('/:id/availability', roomController.checkAvailability);

module.exports = router;