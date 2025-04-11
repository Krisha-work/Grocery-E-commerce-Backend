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
  createTestProduct,
  createTestCategory,
  mockSession
} from '../helpers/testUtils';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';

// Mock Cloudinary
jest.mock('../../config/cloudinary', () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://example.com/image.jpg' } as never),
  deleteFromCloudinary: jest.fn().mockResolvedValue(true as never)
}));

describe('Product Routes', () => {
  let testUser: any;
  let testProduct: any;
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
    
    // Create test product
    testProduct = await createTestProduct(testCategory.name);
  });

  afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    session.destroy();
  });

  describe('GET /api/products', () => {
    it('should return all products with pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: testCategory.name });

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((product: any) => {
        expect(product.category).toBe(testCategory.name);
      });
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 0, maxPrice: 1000 });

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(0);
        expect(product.price).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single product with reviews', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id', testProduct.id);
      expect(response.body.data).toHaveProperty('reviews');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999');

      expect(response.status).toBe(StatusCode.NOT_FOUND);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product with valid data', async () => {
      const productData = {
        name: 'New Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 100,
        category: testCategory.name
      };

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', [`token=${authToken}`])
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('stock', productData.stock)
        .field('category', productData.category)
        .attach('images', 'test/fixtures/test-image.jpg');

      expect(response.status).toBe(StatusCode.CREATED);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject(productData);
      expect(uploadToCloudinary).toHaveBeenCalled();
    });

    it('should reject product creation with invalid data', async () => {
      const invalidProductData = {
        name: '',
        price: -100,
        category: 'Invalid Category'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', [`token=${authToken}`])
        .send(invalidProductData);

      expect(response.status).toBe(StatusCode.BAD_REQUEST);
      expect(response.body.status).toBe('error');
    });

    it('should reject product creation without authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({ name: 'Test Product' });

      expect(response.status).toBe(StatusCode.UNAUTHORIZED);
      expect(response.body.status).toBe(undefined);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update an existing product', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 149.99
      };

      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Cookie', [`token=${authToken}`])
        .send(updateData);

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toMatchObject(updateData);
    });

    it('should update product image', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Cookie', [`token=${authToken}`])
        .attach('images', 'test/fixtures/test-image.jpg');

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(deleteFromCloudinary).toHaveBeenCalled();
      expect(uploadToCloudinary).toHaveBeenCalled();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/api/products/99999')
        .set('Cookie', [`token=${authToken}`])
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(StatusCode.NOT_FOUND);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(StatusCode.OK);
      expect(response.body.status).toBe('success');
      expect(deleteFromCloudinary).toHaveBeenCalled();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/products/99999')
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(StatusCode.NOT_FOUND);
      expect(response.body.status).toBe('error');
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(StatusCode.UNAUTHORIZED);
      expect(response.body.status).toBe(undefined);
    });
  });
}); 