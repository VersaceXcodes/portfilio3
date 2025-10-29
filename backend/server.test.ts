// Import necessary modules and libraries
import request from 'supertest';
import { app, pool } from './server.ts'; // import your Express app instance and database pool
import { createUserInputSchema } from './db:zodschemas.ts'; // import Zod schemas for validation

describe("Portfolio3 Backend Integration Tests", () => {

  beforeAll(async () => {
    // Initialize or reset test database, mock connections if necessary
    await pool.query("BEGIN"); // Start transaction for test isolation
  });

  afterAll(async () => {
    // Clean up any remaining data and close connections
    await pool.query("ROLLBACK"); // Rollback changes made during tests
    await pool.end();
  });

  describe("User Authentication", () => {

    // Test user registration endpoint
    it("should register a new user successfully", async () => {
      const newUser = {
        email: "test.user@example.com",
        password_hash: "password123", // For testing purpose only, no hashing
        name: "Test User"
      };

      const response = await request(app)
        .post('/auth/register')
        .send(newUser);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(newUser.email);
    });

    // Test login endpoint
    it("should log in an existing user", async () => {
      const existingUser = {
        email: "john.doe@example.com",
        password: "password123"
      };

      const response = await request(app)
        .post('/auth/login')
        .send(existingUser);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined(); // Check if a token is issued
    });

    // Test password reset initiation endpoint
    it("should initiate password reset for existing email", async () => {
      const response = await request(app)
        .post('/auth/password-reset')
        .send({ email: "john.doe@example.com" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password reset email sent");
    });

  });

  describe("REST API Endpoints", () => {

    describe("GET /users/:user_id", () => {

      it("should retrieve a user's profile", async () => {
        const response = await request(app)
          .get('/users/user1');

        expect(response.status).toBe(200);
        expect(response.body.user_id).toBe("user1");
      });

    });

    describe("Projects Endpoints", () => {

      // Test creating a new project
      it("should create a new project successfully", async () => {
        const newProject = {
          title: "Test Project",
          description: "A project for testing.",
          user_id: "user1"
        };

        const response = await request(app)
          .post('/users/user1/projects')
          .send(newProject);

        expect(response.status).toBe(201);
        expect(response.body.title).toBe(newProject.title);
      });

      // Test updating a project
      it("should update an existing project", async () => {
        const updateData = { title: "Updated Project Title" };

        const response = await request(app)
          .patch('/projects/project1')
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.title).toBe(updateData.title);
      });

      // Test deleting a project
      it("should delete a project", async () => {
        const response = await request(app)
          .delete('/projects/project1');

        expect(response.status).toBe(204);
      });

    });

  });

  // Add more endpoint tests as needed...

});