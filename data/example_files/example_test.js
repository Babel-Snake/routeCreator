const request = require('supertest');
const path = require('path');
const dotenv = require('dotenv');
const sequelize = require('../../sophia-backend/config/database');
const app = require('../../sophia-backend/server');
const { Admin, LearningHub, SupervisorHub } = require('../../sophia-backend/models');
const { admin } = require('../../sophia-backend/utils/firebase/firebaseUtils');
const { resetAutoIncrement } = require('../../sophia-backend/utils/dbUtils/dbUtils');
const { deleteFirebaseUserByEmail } = require('../../sophia-backend/utils/firebase/firebaseUtils');

delete require.cache[require.resolve('dotenv')];

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let createdFirebaseUserIds = [];
let createdAdminIds = [];
let createdLearningHubIds = [];

// Set global Jest timeout
jest.setTimeout(30000);

// This will clear data created during tests
afterEach(async () => {
  console.log("Running afterEach hook");

  // Delete the created Firebase users
  for (const firebaseUserId of createdFirebaseUserIds) {
    try {
      await admin.auth().deleteUser(firebaseUserId);
      console.log(`Deleted Firebase user with ID: ${firebaseUserId}`);
    } catch (error) {
      console.error(`Error deleting Firebase user with ID ${firebaseUserId}:`, error);
    }
  }
  createdFirebaseUserIds = [];

  // Delete the created Admin entries
  for (const adminId of createdAdminIds) {
    try {
      await Admin.destroy({ where: { id: adminId } });
      console.log(`Deleted Admin with ID: ${adminId}`);
    } catch (error) {
      console.error(`Error deleting Admin with ID ${adminId}:`, error);
    }
  }
  createdAdminIds = [];

  // Delete the created LearningHub entries
  for (const learningHubId of createdLearningHubIds) {
    try {
      await LearningHub.destroy({ where: { id: learningHubId } });
      console.log(`Deleted LearningHub with ID: ${learningHubId}`);
    } catch (error) {
      console.error(`Error deleting LearningHub with ID ${learningHubId}:`, error);
    }
  }
  createdLearningHubIds = [];

  // Ensure any missed users are deleted by email
  const testEmails = [
    'servercrash@example.com',
    'rollback@example.com',
    'db@example.com'
  ];

  for (const email of testEmails) {
    await deleteFirebaseUserByEmail(email);
  }

  // Reset the auto-increment values
  await resetAutoIncrement('admin');
  await resetAutoIncrement('learning_hubs');
});

// This will clear the initial seed data
afterAll(async () => {
  console.log("Running afterAll hook");

  // Fetch and delete initial seeded data
  const initialAdmin = await Admin.findOne({ where: { email: 'initial@example.com' } });
  if (initialAdmin) {
    try {
      await admin.auth().deleteUser(initialAdmin.firebase_uid);
      console.log(`Deleted Firebase user with ID: ${initialAdmin.firebase_uid}`);
    } catch (error) {
      console.error('Error deleting Firebase user:', error);
    }
    await Admin.destroy({ where: { id: initialAdmin.id } });
    console.log(`Deleted Admin with ID: ${initialAdmin.id}`);
  }

  await LearningHub.destroy({ where: { name: "initialAdmin's Learning Hub" } });
  console.log("Deleted initial LearningHub");

  await SupervisorHub.destroy({ where: { admin_id: initialAdmin ? initialAdmin.id : null } });
  console.log("Deleted initial SupervisorHub");

  // Ensure all users created in specific tests are deleted
  const testEmails = [
    'newvalid@example.com',
    'valid@example.com',
    'firebase@example.com',
    'db@example.com',
    'servercrash@example.com',
    'firebaseunavailable@example.com',
    'rollback@example.com',
    'newvalid@example.com',
    'multi1@example.com',
    'multi2@example.com',
    'multi3@example.com'
  ];

  for (const email of testEmails) {
    await deleteFirebaseUserByEmail(email);
  }

  // Explicitly delete specific persistent entries
  const persistentEmails = ['db@example.com'];
  for (const email of persistentEmails) {
    const admin = await Admin.findOne({ where: { email } });
    if (admin) {
      try {
        await Admin.destroy({ where: { id: admin.id } });
        console.log(`Deleted persistent Admin with ID: ${admin.id}`);
      } catch (error) {
        console.error(`Error deleting persistent Admin with ID ${admin.id}:`, error);
      }

      const learningHub = await LearningHub.findOne({ where: { id: admin.id } });
      if (learningHub) {
        try {
          await LearningHub.destroy({ where: { id: learningHub.id } });
          console.log(`Deleted persistent LearningHub with ID: ${learningHub.id}`);
        } catch (error) {
          console.error(`Error deleting persistent LearningHub with ID ${learningHub.id}:`, error);
        }
      }

      const supervisorHub = await SupervisorHub.findOne({ where: { admin_id: admin.id } });
      if (supervisorHub) {
        try {
          await SupervisorHub.destroy({ where: { admin_id: admin.id } });
          console.log(`Deleted persistent SupervisorHub with ID: ${supervisorHub.id}`);
        } catch (error) {
          console.error(`Error deleting persistent SupervisorHub with ID ${supervisorHub.id}:`, error);
        }
      }
    }
  }

  await sequelize.close();
  console.log("Database connection closed");
});



describe('Admin Registration Tests', () => {
  it('should register a valid admin', async () => {
    const response = await request(app)
      .post('/api/admin/register')
      .send({
        email: 'newvalid@example.com',
        password: 'newValidPass1!',
        username: 'newvalidUser'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Admin registered successfully');

    const admin = await Admin.findOne({ where: { email: 'newvalid@example.com' } });
    expect(admin).not.toBeNull();
    expect(admin.role).toBe('hub_supervisor');

    const supervisorHub = await SupervisorHub.findOne({ where: { admin_id: admin.id } });
    expect(supervisorHub).not.toBeNull();

    const learningHub = await LearningHub.findOne({ where: { id: supervisorHub.hub_id } });
    expect(learningHub).not.toBeNull();

    createdFirebaseUserIds.push(response.body.firebase_uid);
    createdAdminIds.push(admin.id);
    createdLearningHubIds.push(learningHub.id);
  }, 10000);


    // Invalid Email Format
    it('should fail with invalid email format', async () => {
        const response = await request(app)
            .post('/api/admin/register')
            .send({
                email: 'invalidemail',
                password: 'ValidPass1!',
                username: 'validUser'
            });
           console.log(response.body);
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
            .post('/api/admin/register')
            .send({
                email: 'valid@example.com',
                password: 'Short1!',
                username: 'validUser'
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
            .post('/api/admin/register')
            .send({
                email: 'valid@example.com',
                password: 'ValidPass1',
                username: 'validUser'
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

    // Username Too Short
    it('should fail with username too short', async () => {
        const response = await request(app)
            .post('/api/admin/register')
            .send({
                email: 'valid@example.com',
                password: 'ValidPass1!',
                username: 'v'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Username must be between 3 and 30 characters long."
                })
            ])
        );
    });


// Email Already Registered in Firebase
it('should fail with email already registered in Firebase', async () => {
    const firstResponse = await request(app)
        .post('/api/admin/register')
        .send({
            email: 'firebase@example.com',
            password: 'ValidPass1!',
            username: 'firebaseUser'
        });

    const secondResponse = await request(app)
        .post('/api/admin/register')
        .send({
            email: 'firebase@example.com',
            password: 'ValidPass1!',
            username: 'firebaseUser2'
        });

    expect(secondResponse.statusCode).toBe(400);
    expect(secondResponse.body.message).toMatch(/Email already exists/);

    // Collect IDs for cleanup
    if (firstResponse.statusCode === 201) {
        createdFirebaseUserIds.push(firstResponse.body.firebase_uid);

        const admin = await Admin.findOne({ where: { email: 'firebase@example.com' } });
        if (admin) {
            createdAdminIds.push(admin.id);

            const supervisorHub = await SupervisorHub.findOne({ where: { admin_id: admin.id } });
            if (supervisorHub) {
                createdLearningHubIds.push(supervisorHub.hub_id);
            }
        }
    }
});

// Email Already Registered in Database
it('should fail with email already registered in database', async () => {
    const firstResponse = await request(app)
        .post('/api/admin/register')
        .send({
            email: 'db@example.com',
            password: 'ValidPass1!',
            username: 'dbUser'
        });

    const secondResponse = await request(app)
        .post('/api/admin/register')
        .send({
            email: 'db@example.com',
            password: 'ValidPass1!',
            username: 'dbUser2'
        });

    expect(secondResponse.statusCode).toBe(400);
    expect(secondResponse.body.message).toMatch(/Email already exists in the database/);

    // Collect IDs for cleanup
    if (firstResponse.statusCode === 201) {
        createdFirebaseUserIds.push(firstResponse.body.firebase_uid);

        const admin = await Admin.findOne({ where: { email: 'db@example.com' } });
        if (admin) {
            createdAdminIds.push(admin.id);

            const supervisorHub = await SupervisorHub.findOne({ where: { admin_id: admin.id } });
            if (supervisorHub) {
                createdLearningHubIds.push(supervisorHub.hub_id);
            }
        }
    }
});


    // SQL Injection Attempt
    it('should prevent SQL injection', async () => {
        const response = await request(app)
            .post('/api/admin/register')
            .send({
                email: 'valid@example.com',
                password: 'ValidPass1!',
                username: 'validUser; DROP TABLE admin;'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Username can only contain letters, numbers, and underscores."
                })
            ])
        );
    });

    // XSS Attack
    it('should prevent XSS attack', async () => {
        const response = await request(app)
            .post('/api/admin/register')
            .send({
                email: 'valid@example.com',
                password: 'ValidPass1!',
                username: '<script>alert("XSS")</script>'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: "Username can only contain letters, numbers, and underscores."
                })
            ])
        );
    });
    

  // Database Connection Failure
it('should handle database connection failure', async () => {
    jest.spyOn(Admin, 'create').mockImplementationOnce(() => {
        throw new Error('Database connection failed');
    });

    const response = await request(app)
        .post('/api/admin/register')
        .send({
            email: 'servercrash@example.com',
            password: 'ServerCrash1!',
            username: 'serverCrashUser'
        });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toMatch("Error creating admin with role and hub");

    // Add to cleanup arrays if the user was created in Firebase
    if (response.body.firebase_uid) {
        createdFirebaseUserIds.push(response.body.firebase_uid);
    }
});

// Firebase Service Unavailable
it('should handle Firebase service unavailable', async () => {
    jest.spyOn(admin.auth(), 'getUserByEmail').mockImplementationOnce(() => {
        throw new Error('Firebase service unavailable');
    });

    const response = await request(app)
        .post('/api/admin/register')
        .send({
            email: 'firebaseunavailable@example.com',
            password: 'ValidPass1!',
            username: 'firebaseUnavailableUser'
        });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toMatch(/Error checking email uniqueness/);

    // Add to cleanup arrays if the user was created in Firebase
    if (response.body.firebase_uid) {
        createdFirebaseUserIds.push(response.body.firebase_uid);
    }
});

// Transaction Rollback
it('should rollback transaction on failure', async () => {
    jest.spyOn(LearningHub, 'create').mockImplementationOnce(() => {
        throw new Error('LearningHub creation failed');
    });

    const response = await request(app)
        .post('/api/admin/register')
        .send({
            email: 'rollback@example.com',
            password: 'ValidPass1!',
            username: 'rollbackUser'
        });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toMatch("Error creating admin with role and hub");

    const admin = await Admin.findOne({ where: { email: 'rollback@example.com' } });
    expect(admin).toBeNull();

    // Add to cleanup arrays if the user was created in Firebase
    if (response.body.firebase_uid) {
        createdFirebaseUserIds.push(response.body.firebase_uid);
    }
});

// Multiple Valid Registrations
it('should handle multiple valid registrations', async () => {
    const users = [
        { email: 'multi1@example.com', password: 'ValidPass1!', username: 'multiUser1' },
        { email: 'multi2@example.com', password: 'ValidPass1!', username: 'multiUser2' },
        { email: 'multi3@example.com', password: 'ValidPass1!', username: 'multiUser3' },
    ];

    for (const user of users) {
        const response = await request(app)
            .post('/api/admin/register')
            .send(user);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message', 'Admin registered successfully');

        const admin = await Admin.findOne({ where: { email: user.email } });
        const supervisorHub = await SupervisorHub.findOne({ where: { admin_id: admin.id } });
        const learningHub = await LearningHub.findOne({ where: { id: supervisorHub.hub_id } });

        // Push to arrays for cleanup
        createdFirebaseUserIds.push(response.body.firebase_uid);
        createdAdminIds.push(admin.id);
        createdLearningHubIds.push(learningHub.id);
    }

    for (const user of users) {
        const admin = await Admin.findOne({ where: { email: user.email } });
        expect(admin).not.toBeNull();
        expect(admin.role).toBe('hub_supervisor');

        const supervisorHub = await SupervisorHub.findOne({ where: { admin_id: admin.id } });
        expect(supervisorHub).not.toBeNull();

        const learningHub = await LearningHub.findOne({ where: { id: supervisorHub.hub_id } });
        expect(learningHub).not.toBeNull();
    }
});

});


//});
