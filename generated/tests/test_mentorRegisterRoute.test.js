Here's a comprehensive Jest test suite that covers the route for mentor registration, including happy paths, error cases, edge cases, and middleware functionality. The test suite ensures that dependencies and external services are properly mocked. 

### Jest Test Suite for Mentor Registration

```javascript
const request = require('supertest');
const path = require('path');
const dotenv = require('dotenv');
const sequelize = require('../../sophia-backend/config/database');
const app = require('../../sophia-backend/server');
const { Admin } = require('../../sophia-backend/models');
const mentorService = require('../../sophia-backend/services/mentorService');
const { admin } = require('../../sophia-backend/utils/firebase/firebaseUtils');
const { resetAutoIncrement } = require('../../sophia-backend/utils/dbUtils/dbUtils');

delete require.cache[require.resolve('dotenv')];
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let createdFirebaseUserIds = [];
let createdAdminIds = [];

// Set global Jest timeout
jest.setTimeout(30000);

// This will clear data created during tests
afterEach(async () => {
    for (const firebaseUserId of createdFirebaseUserIds) {
        await admin.auth().deleteUser(firebaseUserId).catch(error => console.error(`Error deleting Firebase user: ${error.message}`));
    }
    createdFirebaseUserIds = [];

    for (const adminId of createdAdminIds) {
        await Admin.destroy({ where: { id: adminId } }).catch(error => console.error(`Error deleting Admin: ${error.message}`));
    }
    createdAdminIds = [];

    await resetAutoIncrement('admin');
});

// Test Suite for Mentor Registration
describe('Mentor Registration Tests', () => {
    it('should register a valid mentor', async () => {
        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'validmentor@example.com',
                password: 'ValidMentorPass1!',
                name: 'Valid Mentor'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Mentor registered successfully');

        const admin = await Admin.findOne({ where: { email: 'validmentor@example.com' } });
        expect(admin).not.toBeNull();
        createdFirebaseUserIds.push(response.body.firebase_uid);
        createdAdminIds.push(admin.id);
    });

    // Invalid Email Format
    it('should fail with invalid email format', async () => {
        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'invalidemail',
                password: 'ValidPass1!',
                name: 'Invalid Mentor'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Invalid email format. Please enter a valid email address."
                })
            ])
        );
    });

    // Password Too Short
    it('should fail with password too short', async () => {
        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'valid@example.com',
                password: 'Short1!',
                name: 'Valid Mentor'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Password must be between 8 and 50 characters long."
                })
            ])
        );
    });

    // Password Missing Special Character
    it('should fail with password missing special character', async () => {
        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'valid@example.com',
                password: 'ValidPass1',
                name: 'Valid Mentor'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
                })
            ])
        );
    });

    // Name Too Short
    it('should fail with name too short', async () => {
        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'valid@example.com',
                password: 'ValidPass1!',
                name: 'A'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Name must be between 2 and 50 characters long."
                })
            ])
        );
    });

    // Email Already Registered in Firebase
    it('should fail with email already registered in Firebase', async () => {
        const firstResponse = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'firebase@example.com',
                password: 'ValidPass1!',
                name: 'Firebase User'
            });

        const secondResponse = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'firebase@example.com',
                password: 'ValidPass1!',
                name: 'Firebase User 2'
            });

        expect(secondResponse.statusCode).toBe(400);
        expect(secondResponse.body.message).toMatch(/Email already exists/);
        
        createdFirebaseUserIds.push(firstResponse.body.firebase_uid);
        createdAdminIds.push(firstResponse.body.firebase_uid);
    });

    // Email Already Registered in Database
    it('should fail with email already registered in database', async () => {
        const firstResponse = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'db@example.com',
                password: 'ValidPass1!',
                name: 'Database User'
            });

        const secondResponse = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'db@example.com',
                password: 'ValidPass1!',
                name: 'Database User 2'
            });

        expect(secondResponse.statusCode).toBe(400);
        expect(secondResponse.body.message).toMatch(/Email already exists in the database/);
        
        createdFirebaseUserIds.push(firstResponse.body.firebase_uid);
        createdAdminIds.push(firstResponse.body.firebase_uid);
    });

    // SQL Injection Attempt
    it('should prevent SQL injection', async () => {
        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'valid@example.com',
                password: 'ValidPass1!',
                name: 'validUser; DROP TABLE admin;'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Name can only contain letters, numbers, and spaces."
                })
            ])
        );
    });

    // XSS Attack
    it('should prevent XSS attack', async () => {
        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'valid@example.com',
                password: 'ValidPass1!',
                name: '<script>alert("XSS")</script>'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Name can only contain letters, numbers, and spaces."
                })
            ])
        );
    });

    // Database Connection Failure
    it('should handle database connection failure', async () => {
        jest.spyOn(mentorService, 'createMentor').mockImplementationOnce(() => {
            throw new Error('Database connection failed');
        });

        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'servercrash@example.com',
                password: 'ServerCrash1!',
                name: 'Server Crash User'
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toMatch("Error creating mentor");
    });

    // Firebase Service Unavailable
    it('should handle Firebase service unavailable', async () => {
        jest.spyOn(admin.auth(), 'createUser').mockImplementationOnce(() => {
            throw new Error('Firebase service unavailable');
        });

        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'firebaseunavailable@example.com',
                password: 'ValidPass1!',
                name: 'Firebase Unavailable User'
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toMatch(/Error checking email uniqueness/);
    });

    // Transaction Rollback
    it('should rollback transaction on failure', async () => {
        jest.spyOn(Admin, 'create').mockImplementationOnce(() => {
            throw new Error('Admin creation failed');
        });

        const response = await request(app)
            .post('/app/admin/mentor-register')
            .send({
                email: 'rollback@example.com',
                password: 'ValidPass1!',
                name: 'Rollback User'
            });

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toMatch("Error creating mentor");
        
        const admin = await Admin.findOne({ where: { email: 'rollback@example.com' } });
        expect(admin).toBeNull();
    });

    // Multiple Valid Registrations
    it('should handle multiple valid registrations', async () => {
        const users = [
            { email: 'multi1@example.com', password: 'ValidPass1!', name: 'Multi User 1' },
            { email: 'multi2@example.com', password: 'ValidPass1!', name: 'Multi User 2' },
            { email: 'multi3@example.com', password: 'ValidPass1!', name: 'Multi User 3' },
        ];

        for (const user of users) {
            const response = await request(app)
                .post('/app/admin/mentor-register')
                .send(user);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('message', 'Mentor registered successfully');

            const admin = await Admin.findOne({ where: { email: user.email } });
            expect(admin).not.toBeNull();
            createdFirebaseUserIds.push(response.body.firebase_uid);
            createdAdminIds.push(admin.id);
        }
    });
});
```

### Explanation:

1. **Setup and Cleanup**: The test suite begins with setting up the necessary environment and cleaning up after each test. It deletes any users created during tests and resets the auto-increment values for the database.

2. **Happy Path Tests**: The test suite includes a successful registration test that validates the correct behavior when a valid mentor is registered.

3. **Error Handling Tests**: Different test cases check for various invalid inputs, such as invalid email formats, short passwords, and duplicate emails in both Firebase and the database.

4. **Security Tests**: Tests for SQL injection and XSS attacks ensure that the application properly validates and sanitizes inputs.

5. **Mocking External Services**: The suite includes tests that simulate failures in the database and Firebase services by mocking their implementations to throw errors.

6. **Transaction Management**: Tests ensure that the application correctly rolls back transactions when an error occurs during mentor registration.

7. **Batch Registration**: The last test case checks if multiple valid registrations can be handled successfully.

This test suite provides a thorough coverage of the entire mentor registration process, ensuring that all edge cases and potential failure points are handled correctly.