import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import AppError from './utils/AppError.js';
import logger from './config/logger.js';

dotenv.config();

const app = express();

app.use(cors());

// Capture raw JSON body for debugging (temporary)
app.use(
  express.json({
    verify: (req, res, buf) => {
      try {
        req.rawBody = buf && buf.length ? buf.toString() : '';
      } catch (err) {
        req.rawBody = '';
      }
    },
  })
);

// Log raw body for incoming auth POST requests (debug only)
app.use((req, res, next) => {
  if (req.method === 'POST' && req.originalUrl && req.originalUrl.startsWith('/api/auth')) {
    logger.debug(`Raw body for ${req.originalUrl}: ${req.rawBody}`);
  }
  next();
});

// Connect Auth Database
connectDB();

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'auth-service'
  });
});

app.use('/api/auth', authRoutes);

// 1. Handle unhandled routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// 2. Global Error Handling Middleware (Must have 4 arguments)
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Only log stack trace for real server crashes (500s), ignore operational errors (4xx)
  if (err.statusCode >= 500) {
    console.error('💥 UNEXPECTED ERROR:', err);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

export default app;