import express from 'express';
import { validate } from '../middlewares/validateMiddleware.js';
import { registerSchema, loginSchema, resetPasswordSchema, forgotPasswordSchema } from '../validators/schemas.js';
import {
  loginUser,
  registerWithOTP,
  resendOTP,
  sendOTP,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { otpRateLimiter } from '../middlewares/rateLimiter.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send-otp', otpRateLimiter, sendOTP);
router.post('/resend-otp', otpRateLimiter, resendOTP);
router.post('/register', validate(registerSchema), registerWithOTP);
router.post('/login', validate(loginSchema), loginUser);


// Password Management Routes
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
