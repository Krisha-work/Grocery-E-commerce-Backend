import { Router } from 'express';
import {
  register,
  login,
  logout,
  updateProfile,
  verifyProfileUpdate,
  getProfile,
  resetPassword,
  forgotPassword,
  verifyEmail,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);

// Authenticate all routes after this middleware
router.use(authenticate);

// Protected routes
router.get('/profile', getProfile);
router.post('/logout', logout);
router.put('/profile', updateProfile);
router.post('/profile/verify', verifyProfileUpdate);
router.put('/reset-password', resetPassword);

export default router; 