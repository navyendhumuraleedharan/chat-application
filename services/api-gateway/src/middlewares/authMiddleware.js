import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify JWT token signature locally using secret key
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your_super_secret_jwt_key_here'
      );

      // Pass user metadata to downstream microservices via custom headers
      req.headers['x-user-id'] = decoded.id;
      return next();
    } catch (error) {
      return res.status(401).json({
        status: 'fail',
        message: 'Not authorized, token invalid or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized, no token provided',
    });
  }
};