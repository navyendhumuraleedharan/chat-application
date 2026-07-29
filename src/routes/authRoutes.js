import express from 'express';
import { registerWithOTP, resendOTP, sendOTP } from '../controllers/authController.js';
import { otpRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/send-otp', otpRateLimiter, sendOTP);
router.post('/resend-otp', otpRateLimiter, resendOTP);
router.post('/register', registerWithOTP);

export default router;
