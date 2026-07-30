import express from 'express';
import {
  getMe,
  loginUser,
  registerWithOTP,
  resendOTP,
  sendOTP,
} from '../controllers/authController.js';
import { otpRateLimiter } from '../middlewares/rateLimiter.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send-otp', otpRateLimiter, sendOTP);
router.post('/resend-otp', otpRateLimiter, resendOTP);
router.post('/register', registerWithOTP);
router.post('/login', loginUser);

// Protected routes (JWT required)
router.get('/me', protect, getMe);

export default router;
