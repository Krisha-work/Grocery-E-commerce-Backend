import { Express } from 'express';
import User from '../../models/user.model';
import Category from '../../models/category.model';
import Product from '../../models/product.model';
import { generateToken } from '../../middleware/auth';

export const clearDatabase = async () => {
  await User.destroy({ where: {} });
  await Category.destroy({ where: {} });
  await Product.destroy({ where: {} });
};

export const closeDatabase = async () => {
  // Add any necessary cleanup
};

export const createTestUser = async () => {
  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test@123',
    is_verified: true,
    is_admin: false
  });
  const token = generateToken({ id: user.id, isAdmin: user.is_admin } as User & { isAdmin: boolean });
  return { user, token };
};

export const createTestCategory = async () => {
  return await Category.create({
    name: 'Test Category',
    description: 'Test Description',
    image_url: 'https://example.com/image.jpg'
  });
};

export const mockSession = () => {
  const store: { [key: string]: any } = {};
  return {
    destroy: jest.fn(),
    get: jest.fn((key: string) => store[key]),
    set: jest.fn((key: string, value: any) => { store[key] = value; })
  };
};

export const mockEmailService = {
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendProfileUpdateVerificationEmail: jest.fn()
};

export const validUserData = {
  username: 'John_Doe123',
  email: 'john@example.com',
  password: 'Password@123'
};

export const invalidUserData = {
  username: 'inv',
  email: 'invalid-email',
  password: 'weak'
};

export const createTestProduct = async (categoryId: number) => {
  return await Product.create({
    name: 'Test Product',
    description: 'Test Product Description',
    price: 99.99,
    stock: 100,
    category: categoryId.toString(),
    image_url: 'https://example.com/product.jpg'
  });
}; 