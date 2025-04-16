import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import {
  createOrder,
  getOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  processPayment,
  handleWebhook,
} from '../controllers/order.controller';

const router = Router();

router.use(authenticate);

// Protected routes
router.post('/create', createOrder);
router.get('/user', getUserOrders);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);
router.post('/payment', processPayment);

router.use(isAdmin);
// Admin routes
router.get('/', getAllOrders);
router.put('/:id/status', updateOrderStatus);

// Webhook route (no authentication needed)
router.post('/webhook', handleWebhook);

export default router; 