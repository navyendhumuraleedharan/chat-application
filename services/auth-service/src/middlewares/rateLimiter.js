import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    if (req.body && req.body.email) {
      return req.body.email.trim().toLowerCase();
    }
    // Correct fallback using helper to handle IPv6 properly
    return ipKeyGenerator(req);
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Too many OTP requests for this email address. Please wait 15 minutes.'
    });
  }
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
