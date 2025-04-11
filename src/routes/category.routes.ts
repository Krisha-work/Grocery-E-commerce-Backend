import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryProducts,
} from '../controllers/category.controller';

const router = Router();

// Public routes
router.get('/', getCategories);
router.get('/:id/products', getCategoryProducts);

router.use(authenticate, isAdmin);
// Admin routes
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router; 