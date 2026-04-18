import ResponseHandler from '../utils/responseHandler.js';

export const globalErrorHandler = (err, req, res, next) => {
  console.error('Error caught by global handler:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
  });

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

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

  else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Resource not found';
  }

  else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }

  else if (err.code === 'P2014') {
    statusCode = 422;
    message = 'Required field is missing';
  }

  else if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    message = isDevelopment ? err.message : 'Database operation failed';
  }


  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }


  else if (err.name === 'ValidationError') {
    statusCode = 422;
    message = err.message || 'Validation failed';
    errors = err.errors; // Should be array of { field, message }
  }

  else if (err.statusCode) {
    // Custom error classes have statusCode property
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || null;
  }

  if (isDevelopment) {
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

  return ResponseHandler.error(res, message, statusCode, errors);
};

export default globalErrorHandler;
