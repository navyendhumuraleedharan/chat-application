import express from 'express';
import { validate } from '../middlewares/validateMiddleware.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
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
router.post('/register', validate(registerSchema), registerWithOTP);
router.post('/login', validate(loginSchema), loginUser);

// Protected routes (JWT required)
router.get('/me', protect, getMe);

export default router;
