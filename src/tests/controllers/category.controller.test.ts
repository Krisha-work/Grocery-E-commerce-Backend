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
  createTestCategory,
  mockSession
} from '../helpers/testUtils';

describe('Category Routes', () => {
  let testUser: any;
  let testCategory: any;
  let authToken: string;
  let session: any;

  beforeAll(async () => {
    await clearDatabase();
    const testData = await createTestUser();
    testUser = testData.user;
    authToken = testData.token;
    session = mockSession();

    // Create test category
    testCategory = await createTestCategory();
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    session.destroy();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/categories/:id/products', () => {
    it('should return products for a category with pagination', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategory.id}/products`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/99999/products');

      expect(response.status).toBe(StatusCode.NOT_FOUND);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category with valid data', async () => {
      const categoryData = {
        name: 'New Test Category',
        description: 'Test Description',
        image_url: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Cookie', [`token=${authToken}`])
        .send(categoryData);

      expect(response.status).toBe(StatusCode.CREATED);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject(categoryData);
    });

    it('should reject category creation with invalid data', async () => {
      const invalidCategoryData = {
        name: '',
        image_url: 'invalid-url'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Cookie', [`token=${authToken}`])
        .send(invalidCategoryData);

      expect(response.status).toBe(StatusCode.BAD_REQUEST);
      expect(response.body.status).toBe('error');
    });

    it('should reject category creation without authentication', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test Category' });

      expect(response.status).toBe(StatusCode.UNAUTHORIZED);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update an existing category', async () => {
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated Description'
      };

      const response = await request(app)
        .put(`/api/categories/${testCategory.id}`)
        .set('Cookie', [`token=${authToken}`])
        .send(updateData);

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject(updateData);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .put('/api/categories/99999')
        .set('Cookie', [`token=${authToken}`])
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(StatusCode.NOT_FOUND);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      const response = await request(app)
        .delete(`/api/categories/${testCategory.id}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/categories/99999')
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(StatusCode.NOT_FOUND);
      expect(response.body.status).toBe('error');
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/categories/${testCategory.id}`);

      expect(response.status).toBe(StatusCode.UNAUTHORIZED);
    });
  });
}); 