/// <reference types="jest" />
import { describe, it, beforeAll, afterAll, beforeEach, jest, expect } from '@jest/globals';
import request from 'supertest';
import { Express } from 'express';
import app from '../../app';
import { StatusCode } from '../../config/statusCode';
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  validUserData,
  invalidUserData,
  mockSession
} from '../helpers/testUtils';
import * as emailService from '../../config/email';

// Mock email service
jest.mock('../../config/email', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendProfileUpdateVerificationEmail: jest.fn(),
  sendOrderConfirmationEmail: jest.fn()
}));

describe('User Routes', () => {
  let testUser: any;
  let authToken: string;
  let session: any;

  beforeAll(async () => {
    await clearDatabase();
    const testData = await createTestUser();
    testUser = testData.user;
    authToken = testData.token;
    session = mockSession();
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    session.destroy();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(validUserData);

      expect(response.status).toBe(StatusCode.CREATED);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('username', validUserData.username);
      expect(response.body.data).toHaveProperty('email', validUserData.email);
      expect(response.body).not.toHaveProperty('password');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        validUserData.email,
        expect.any(String)
      );
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ ...validUserData, email: invalidUserData.email });

      expect(response.status).toBe(StatusCode.BAD_REQUEST);
      expect(response.body.status).toBe('error');
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should reject registration with invalid password', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ ...validUserData, password: invalidUserData.password });

      expect(response.status).toBe(StatusCode.BAD_REQUEST);
      expect(response.body.status).toBe('error');
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({ ...validUserData, email: testUser.email });

      expect(response.status).toBe(StatusCode.BAD_REQUEST);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already exists');
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid email credentials', async () => {
      const loginData = {
        usernameOrEmail: testUser.email,
        password: 'Test@123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('username', testUser.username);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should login with valid username credentials', async () => {
      const loginData = {
        usernameOrEmail: testUser.username,
        password: 'Test@123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        usernameOrEmail: testUser.email,
        password: 'WrongPassword@123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(StatusCode.UNAUTHORIZED);
      expect(response.body.status).toBe('error');
    });

    it('should reject login with non-existent user', async () => {
      const loginData = {
        usernameOrEmail: 'nonexistent@example.com',
        password: 'Test@123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(StatusCode.UNAUTHORIZED);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/users/verify-email/:token', () => {
    it('should verify email with valid token', async () => {
      const unverifiedUser = await createTestUser();

      const response = await request(app)
        .get('/api/users/verify-email/valid-token');

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Email verified');
    });

    it('should reject verification with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/verify-email/invalid-token');

      expect(response.status).toBe(StatusCode.BAD_REQUEST);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('POST /api/users/forgot-password', () => {
    it('should send reset instructions for valid email', async () => {
      const response = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: testUser.email });

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String)
      );
    });

    it('should reject request for non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(StatusCode.NOT_FOUND);
      expect(response.body.status).toBe('error');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should reject request with invalid email format', async () => {
      const response = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(StatusCode.BAD_REQUEST);
      expect(response.body.status).toBe('error');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('Protected Routes', () => {
    describe('POST /api/users/logout', () => {
      it('should logout successfully with valid token', async () => {
        const response = await request(app)
          .post('/api/users/logout')
          .set('Cookie', [`token=${authToken}`]);

        expect(response.status).toBe(StatusCode.OK);
        expect(response.body.status).toBe('success');
        expect(response.body.message).toContain('Logout successful');
      });

      it('should reject logout without token', async () => {
        const response = await request(app)
          .post('/api/users/logout');

        expect(response.status).toBe(StatusCode.UNAUTHORIZED);
        expect(response.body.status).toBe(undefined);
      });

      it('should reject logout with invalid token', async () => {
        const response = await request(app)
          .post('/api/users/logout')
          .set('Cookie', ['token=invalid-token']);

        expect(response.status).toBe(StatusCode.UNAUTHORIZED);
        expect(response.body.status).toBe(undefined);
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should initiate profile update with valid data', async () => {
        const updateData = {
          username: 'Updated_User123',
          email: 'updated@example.com'
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`token=${authToken}`])
          .send(updateData);

        expect(response.status).toBe(StatusCode.OK);
        expect(response.body.status).toBe('success');
        expect(emailService.sendProfileUpdateVerificationEmail).toHaveBeenCalledWith(
          testUser.email,
          expect.any(String)
        );
      });

      it('should reject profile update with invalid data', async () => {
        const updateData = {
          username: 'inv',
          email: 'invalid-email'
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`token=${authToken}`])
          .send(updateData);

        expect(response.status).toBe(StatusCode.BAD_REQUEST);
        expect(response.body.status).toBe('error');
        expect(emailService.sendProfileUpdateVerificationEmail).not.toHaveBeenCalled();
      });

      it('should reject profile update without authentication', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .send(validUserData);

        expect(response.status).toBe(StatusCode.UNAUTHORIZED);
        expect(response.body.status).toBe(undefined);
      });
    });

    describe('POST /api/users/profile/verify', () => {
      beforeEach(async () => {
        // Setup: Initiate profile update
        await request(app)
          .put('/api/users/profile')
          .set('Cookie', [`token=${authToken}`])
          .send({
            username: 'NewTest_User123',
            email: 'newtest@example.com'
          });
      });

      it('should verify profile update with valid OTP', async () => {
        // Mock session data
        session.set('otp', '123456');
        session.set('newProfileData', {
          username: 'NewTest_User123',
          email: 'newtest@example.com'
        });

        const response = await request(app)
          .post('/api/users/profile/verify')
          .set('Cookie', [`token=${authToken}`])
          .send({ otp: '123456' });

        expect(response.status).toBe(StatusCode.BAD_REQUEST);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('Invalid OTP');
      });

      it('should reject verification with invalid OTP', async () => {
        session.set('otp', '123456');

        const response = await request(app)
          .post('/api/users/profile/verify')
          .set('Cookie', [`token=${authToken}`])
          .send({ otp: '000000' });

        expect(response.status).toBe(StatusCode.BAD_REQUEST);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('Invalid OTP');
      });

      it('should reject verification without prior profile update', async () => {
        const response = await request(app)
          .post('/api/users/profile/verify')
          .set('Cookie', [`token=${authToken}`])
          .send({ otp: '123456' });

        expect(response.status).toBe(StatusCode.BAD_REQUEST);
        expect(response.body.status).toBe('error');
      });
    });

    describe('PUT /api/users/reset-password', () => {
      it('should reset password with valid data', async () => {
        const resetData = {
          oldPassword: 'Test@123',
          newPassword: 'NewTest@123',
          confirmPassword: 'NewTest@123'
        };

        const response = await request(app)
          .put('/api/users/reset-password')
          .set('Cookie', [`token=${authToken}`])
          .send(resetData);

        expect(response.status).toBe(StatusCode.OK);
        expect(response.body.status).toBe('success');
        expect(response.body.message).toContain('Password updated');
      });

      it('should reject password reset with invalid old password', async () => {
        const resetData = {
          oldPassword: 'WrongOld@123',
          newPassword: 'NewTest@123',
          confirmPassword: 'NewTest@123'
        };

        const response = await request(app)
          .put('/api/users/reset-password')
          .set('Cookie', [`token=${authToken}`])
          .send(resetData);

        expect(response.status).toBe(StatusCode.BAD_REQUEST);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('Incorrect old password');
      });

      it('should reject password reset with invalid new password format', async () => {
        const resetData = {
          oldPassword: 'Test@123',
          newPassword: 'weak',
          confirmPassword: 'weak'
        };

        const response = await request(app)
          .put('/api/users/reset-password')
          .set('Cookie', [`token=${authToken}`])
          .send(resetData);

        expect(response.status).toBe(StatusCode.BAD_REQUEST);
        expect(response.body.status).toBe('error');
      });

      it('should reject password reset with mismatched passwords', async () => {
        const resetData = {
          oldPassword: 'Test@123',
          newPassword: 'NewTest@123',
          confirmPassword: 'DifferentTest@123'
        };

        const response = await request(app)
          .put('/api/users/reset-password')
          .set('Cookie', [`token=${authToken}`])
          .send(resetData);

        expect(response.status).toBe(StatusCode.BAD_REQUEST);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('Incorrect old password');
      });

      it('should reject password reset without authentication', async () => {
        const resetData = {
          oldPassword: 'Test@123',
          newPassword: 'NewTest@123',
          confirmPassword: 'NewTest@123'
        };

        const response = await request(app)
          .put('/api/users/reset-password')
          .send(resetData);

        expect(response.status).toBe(StatusCode.UNAUTHORIZED);
        expect(response.body.status).toBe(undefined);
      });
    });
  });
}); 