```javascript
/**
 * mentorRoutes.js
 * 
 * This file defines the routes for mentor-related operations.
 * It sets up the Express router, applies necessary middlewares, 
 * and defines the route handlers for mentor registration.
 */

const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController'); // Controller for mentor operations
const validateMentorRegistration = require('../middleware/validation/validateMentorInputs'); // Middleware for input validation
const checkEmailUniqueness = require('../middleware/validation/checkEmailUniqueness'); // Middleware to check email uniqueness
const { createRateLimiter } = require('../utils/ratelimiting/rateLimiter'); // Utility to create a rate limiter
const sanitizeAllInputs = require('../middleware/security/sanitizeAllInputs'); // Middleware to sanitize inputs

// Create a rate limiter for the mentor registration route
const mentorRegisterRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
});

// Apply the sanitization middleware to all routes in this router
router.use(sanitizeAllInputs);

/**
 * Route to register a new mentor.
 * 
 * This route handles the registration of new mentors. It applies the rate limiter,
 * input validation, email uniqueness check, and then calls the controller to handle the registration logic.
 * 
 * @route POST /app/admin/mentor-register
 */
router.post('/mentor-register', mentorRegisterRateLimiter, validateMentorRegistration, checkEmailUniqueness, mentorController.registerMentor);

module.exports = router;
```

### Explanation:
1. **File Header**: The header provides a brief description of the file's purpose.
2. **Imports**: Necessary modules, controllers, and middleware are imported to handle the requests.
3. **Rate Limiting**: A rate limiter is set up to prevent abuse of the registration route, allowing a maximum of 5 requests every 15 minutes.
4. **Sanitization Middleware**: The sanitizer middleware is applied to ensure that all inputs are cleaned before processing.
5. **Route Definition**: The POST route for registering a mentor is defined with all necessary middleware for validation and uniqueness checks.
6. **Exporting the Router**: The configured router is exported for use in the main application. 

This structure adheres to RESTful principles while ensuring proper error handling and input validation.