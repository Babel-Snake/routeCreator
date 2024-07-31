/**
 * adminService.js
 * 
 * This file contains the service logic for admin-related operations.
 * It includes functions to create admin users with a hub supervisor role and their associated learning hubs.
 * This service interacts with Firebase for authentication and custom claims, 
 * and with the database for storing admin and hub information.
 */

const { createUser, setCustomClaims, sendVerificationEmail, verifyCustomClaims } = require('../utils/firebase/firebaseUtils');
const { Admin, LearningHub, SupervisorHub, sequelize } = require('../models');
const logger = require('../utils/logging/logger');
const AppError = require('../utils/errors/errorUtils');
const bcrypt = require('bcrypt');
const saltRounds = 10;

/**
 * Create a new admin user along with their learning hub.
 * 
 * This function handles the creation of a new admin user with the role of "hub_supervisor"
 * and an associated learning hub.
 * 
 * @param {string} email - The email address of the new admin user.
 * @param {string} password - The password for the new admin user.
 * @param {string} username - The username for the new admin user.
 * @returns {object} - An object containing the userRecord, admin, and learningHub details.
 * @throws {AppError} - Throws an error if any step in the process fails.
 */
const createAdminWithRoleAndHub = async (email, password, username) => {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const transaction = await sequelize.transaction();
    try {
        // Create Firebase user
        const userRecord = await createUser(email, password);

        // Set custom claims
        await setCustomClaims(userRecord.uid, { role: 'hub_supervisor' });

        // Verify custom claims (optional, for debugging)
        await verifyCustomClaims(userRecord.uid);

        // Send verification email
        await sendVerificationEmail(userRecord.uid);

        // Log the values being inserted
        logger.info('Inserting into Admin table:', {
            firebase_uid: userRecord.uid,
            email,
            role: 'hub_supervisor',
            username,
        });

        // Add user to the Admin table
        const admin = await Admin.create({
            firebase_uid: userRecord.uid,
            email,
            role: 'hub_supervisor',
            username,
        }, { transaction });

        // Log the values being inserted into LearningHub table
        logger.info('Inserting into LearningHub table:', {
            name: `${username}'s Learning Hub`,
        });

        // Create Learning Hub
        const learningHub = await LearningHub.create({
            name: `${username}'s Learning Hub`,
        }, { transaction });

        // Log the values being inserted into SupervisorHub table
        logger.info('Inserting into SupervisorHub table:', {
            admin_id: admin.id,
            hub_id: learningHub.id,
        });

        // Create SupervisorHub entry to link admin and learning hub
        await SupervisorHub.create({
            admin_id: admin.id,
            hub_id: learningHub.id,
        }, { transaction });

        // Commit the transaction
        await transaction.commit();

        logger.info(`Admin registered successfully: ${email}`);
        return { userRecord, admin, learningHub };
    } catch (error) {
        // Rollback the transaction in case of an error
        await transaction.rollback();
        logger.error('Error creating admin with role and hub:', {
            message: error.message,
            stack: error.stack,
            sql: error.sql,
            sqlState: error.sqlState,
            code: error.code
        });
        throw new AppError('Error creating admin with role and hub', 500);
    }
};

module.exports = { createAdminWithRoleAndHub };
