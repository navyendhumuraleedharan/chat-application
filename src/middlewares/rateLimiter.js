import rateLimit from 'express-rate-limit';

// Rate limiter for OTP requests: max 3 requests per IP every 15 minutes
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 'fail',
    message: 'Too many OTP requests from this IP. Please try again after 15 minutes.',
  },
});

// General auth rate limiter: max 10 requests per IP every 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again later.',
  },
});
