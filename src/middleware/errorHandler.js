/**
 * Global Error Handler Middleware
 * Catches all errors thrown in route handlers and formats them consistently
 * Handles: Prisma errors, JWT errors, Validation errors, and generic errors
 */

import ResponseHandler from '../utils/responseHandler.js';

/**
 * Global error handler middleware
 * Must be registered last in Express app (after all routes and other middleware)
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (err, req, res, next) => {
  console.error('Error caught by global handler:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
  });

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // =========================================================================
  // PRISMA ERRORS
  // =========================================================================

  // P2002: Unique constraint failed
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    statusCode = 409;
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    
    errors = [
      {
        field,
        message: `This ${field} is already in use`,
      },
    ];
  }

  // P2025: Record not found
  else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // P2003: Foreign key constraint failed
  else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }

  // P2014: Field required error
  else if (err.code === 'P2014') {
    statusCode = 422;
    message = 'Required field is missing';
  }

  // Generic Prisma error
  else if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    message = isDevelopment ? err.message : 'Database operation failed';
  }

  // =========================================================================
  // JWT ERRORS
  // =========================================================================

  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // =========================================================================
  // VALIDATION ERRORS
  // =========================================================================

  else if (err.name === 'ValidationError') {
    statusCode = 422;
    message = err.message || 'Validation failed';
    errors = err.errors; // Should be array of { field, message }
  }

  // =========================================================================
  // CUSTOM APP ERRORS (from utils/errors.js)
  // =========================================================================

  else if (err.statusCode) {
    // Custom error classes have statusCode property
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || null;
  }

  // =========================================================================
  // DEVELOPMENT-ONLY RESPONSE
  // =========================================================================

  if (isDevelopment) {
    // In development, include stack trace for debugging
    return ResponseHandler.error(
      res,
      message,
      statusCode,
      {
        errors,
        stack: err.stack,
        details: err.meta || err.details,
      }
    );
  }

  // =========================================================================
  // PRODUCTION RESPONSE
  // =========================================================================

  // Never expose stack traces in production
  return ResponseHandler.error(res, message, statusCode, errors);
};

export default globalErrorHandler;
