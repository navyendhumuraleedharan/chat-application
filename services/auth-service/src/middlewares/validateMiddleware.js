import AppError from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  // Parse body, query, or params depending on request type
  const targetData = Object.keys(req.body || {}).length ? req.body : { ...req.params, ...req.query };
  const result = schema.safeParse(targetData);

  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    const errorMessage = issues.length
      ? issues.map((e) => e.message).join(', ')
      : 'Invalid request payload';

    return next(new AppError(errorMessage, 400));
  }

  // Assign validated and sanitized data back to req.body
  req.body = result.data;
  next();
};