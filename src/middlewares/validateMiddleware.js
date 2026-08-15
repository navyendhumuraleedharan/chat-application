import AppError from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body || {});

  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    const errorMessage = issues.length
      ? issues.map((e) => e.message).join(', ')
      : 'Invalid request payload';

    return next(new AppError(errorMessage, 400));
  }

  req.body = result.data;
  next();
};
