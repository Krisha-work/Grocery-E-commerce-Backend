import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getUserReviews,
} from '../controllers/review.controller';

const router = Router();

// Public routes
router.get('/product/:productId', getProductReviews);

router.use(authenticate);

// Protected routes
router.get('/user', getUserReviews);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router; 