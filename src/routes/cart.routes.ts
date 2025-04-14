import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cart.controller';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get('/', getCart);

// Add item to cart
router.post('/items', addToCart);

// Update cart item quantity
router.put('/items/:cartItemId', updateCartItem);

// Remove item from cart
router.delete('/items/:cartItemId', removeFromCart);

// Clear cart
router.delete('/clear', clearCart);

export default router; 