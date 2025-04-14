import express from 'express';
import { handleUpload } from '../middleware/upload';
import {
  createProduct,
  getAllProducts,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller';
import { authenticate, isAdmin } from '../middleware/auth';
const router = express.Router();

// Get all products (simple list)
router.get('/all', getAllProducts);

// Get products with filtering, pagination and search
router.get('/', getProducts);

// Get single product by ID
router.get('/:id', getProduct);

// Admin routes
router.use(authenticate, isAdmin);

// Create new product
router.post('/', handleUpload('image_url'), createProduct);

// Update product
router.put('/:id', handleUpload('image_url'), updateProduct);

// Delete product
router.delete('/:id', deleteProduct);

export default router;