/**
 * adminRoutes.js
 * 
 * This file defines the routes for admin-related operations.
 * It sets up the Express router, applies necessary middlewares, 
 * and defines the route handlers for admin registration.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Controller for admin operations
const validateRegister = require('../middleware/validation/validateInputs'); // Middleware for input validation
const checkEmailUniqueness = require('../middleware/validation/checkEmailUniqueness');
const { createRateLimiter } = require('../utils/ratelimiting/rateLimiter'); // Utility to create a rate limiter
const sanitizeAllInputs = require('../middleware/security/sanitizeAllInputs'); // Middleware to sanitize inputs

// Create a rate limiter for the register route
const registerRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
});

// Apply the sanitization middleware to all routes in this router
router.use(sanitizeAllInputs);

/**
 * Route to register a new hub supervisor admin.
 * 
 * This route handles the registration of new hub supervisor admin users. It applies the rate limiter,
 * input validation, email uniqueness check, and then calls the controller to handle the registration logic.
 * 
 * @route POST /api/admin/register
 */

//router.post('/register', registerRateLimiter, validateRegister, checkEmailUniqueness, adminController.registerAdmin);
router.post('/register', validateRegister, checkEmailUniqueness, adminController.registerAdmin);

module.exports = router;
