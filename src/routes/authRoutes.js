// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// Public routes
router.post(
    '/register',
    validate(schemas.register),
    authController.register
);

router.post(
    '/login',
    validate(schemas.login),
    authController.login
);

// Protected routes
router.get(
    '/profile',
    auth,
    authController.getProfile
);

router.put(
    '/profile',
    auth,
    validate(schemas.updateProfile),
    authController.updateProfile
);

router.post(
    '/change-password',
    auth,
    validate(schemas.changePassword),
    authController.changePassword
);

router.post(
    '/logout',
    auth,
    authController.logout
);

router.post(
    '/refresh-token',
    auth,
    authController.refreshToken
);

module.exports = router;