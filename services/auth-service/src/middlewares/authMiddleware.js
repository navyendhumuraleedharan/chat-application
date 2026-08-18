import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import userRepository from '../repositories/userRepository.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user from decoded token payload
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    // Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Not authorized, invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Not authorized, token has expired', 401));
    }
    next(error);
  }
};