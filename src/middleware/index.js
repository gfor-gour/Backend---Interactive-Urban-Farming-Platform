/**
 * Middleware Module
 * Exports all custom middleware for authentication, validation, error handling, etc.
 */

export { default as authenticate } from './authenticate.js';
export { authorize } from './authorize.js';
export { globalErrorHandler } from './errorHandler.js';
export { validate, validateAndRespond, checkValidation, ValidationError } from './validate.js';
export {
  authLimiter,
  generalLimiter,
  strictLimiter,
  loginLimiter,
  registerLimiter,
} from './rateLimiter.js';
