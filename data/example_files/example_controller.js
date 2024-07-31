/**
 * adminController.js
 * 
 * This file contains the controller logic for admin-related routes.
 * The controller interacts with the service layer to process requests and generate responses.
 * It is responsible for handling the registration of new admin users, logging relevant information,
 * and managing error responses.
 */

const logger = require('../utils/logging/logger'); // Custom logger for logging events and errors
const adminService = require('../services/adminService'); // Service layer for admin-related business logic
const AppError = require('../utils/errors/errorUtils'); // Custom error class for handling application errors
const { validationResult } = require('express-validator'); // Validator to check for input validation errors

/**
 * Register a new admin user.
 * 
 * This function handles the registration process for new hub supervisor role admin users.
 * It receives the registration details (email, username, and password) from the request body,
 * and utilizes the adminService to create a new admin user along with their associated learning hub.
 * 
 * @param {object} req - Express request object containing the registration details in the body.
 * @param {object} res - Express response object used to send the response.
 * @param {function} next - Express next middleware function for error handling.
 */
const registerAdmin = async (req, res, next) => {
    // Validate the input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body; // Extract registration details from the request body

    try {
        // Attempt to create a new admin hub supervisor user with the provided details
        const { userRecord, admin, learningHub } = await adminService.createAdminWithRoleAndHub(email, password, username);
        
        // Log the successful registration event
        logger.info(`Admin registered successfully: ${email}`, { email, username, ip: req.ip });
        
        // Send a success response with the newly created admin details
        res.status(201).json({
            message: 'Admin registered successfully',
            firebase_uid: userRecord.uid,
            admin,
            learningHub
        });
    } catch (error) {
        // Log the registration failure event
        logger.error(`Admin registration failed for email: ${email}`, { error, email, username, ip: req.ip });
        
        // Pass the error to the next middleware for centralized error handling
        next(new AppError(error.message || 'Admin registration failed', error.statusCode || 500));
    }
};

module.exports = {
    registerAdmin,
};
