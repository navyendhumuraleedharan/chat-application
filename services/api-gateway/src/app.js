import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import proxy from 'express-http-proxy';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { protect } from './middlewares/authMiddleware.js';

dotenv.config();

const app = express();

// Global Security Middlewares
app.use(helmet());
app.use(cors());

// Note: Do NOT use app.use(express.json()) here. 
// express-http-proxy streams req payloads directly to downstream services.

// Global Infrastructure Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use(globalLimiter);

// Gateway Healthcheck Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Target Service URLs (Explicit IPv4 loopback)
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://127.0.0.1:5002';
const MESSAGE_SERVICE = process.env.MESSAGE_SERVICE_URL || 'http://127.0.0.1:5003';

// Standardized Proxy Error Handler
const handleProxyError = (serviceName) => (err, res, next) => {
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      status: 'error',
      message: `${serviceName} is currently unavailable or offline.`,
    });
  }
  next(err);
};

// 1. Auth Service Routes (Public)
app.use(
  '/api/auth',
  proxy(AUTH_SERVICE, {
    proxyReqPathResolver: (req) => `/api/auth${req.url === '/' ? '' : req.url}`,
    proxyErrorHandler: handleProxyError('Auth Service'),
  })
);

// 2. User Service Routes (Protected by Gateway Auth Guard)
app.use(
  '/api/users',
  protect,
  proxy(USER_SERVICE, {
    proxyReqPathResolver: (req) => `/api/users${req.url === '/' ? '' : req.url}`,
    proxyErrorHandler: handleProxyError('User Service'),
  })
);

// 3. Message Service Routes (Protected by Gateway Auth Guard)
app.use(
  '/api/messages',
  protect,
  proxy(MESSAGE_SERVICE, {
    proxyReqPathResolver: (req) => `/api/messages${req.url === '/' ? '' : req.url}`,
    proxyErrorHandler: handleProxyError('Message Service'),
  })
);

// Catch-all 404 Route
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Requested route not found on Gateway',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});