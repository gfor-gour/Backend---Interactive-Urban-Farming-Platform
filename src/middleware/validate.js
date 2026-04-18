/**
 * Validation Middleware Wrapper
 * Wraps express-validator to handle errors consistently
 * Automatically converts validation errors to next(error) for centralized handling
 */

import { validationResult } from 'express-validator';
import ResponseHandler from '../utils/responseHandler.js';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.statusCode = 422;
    this.errors = errors;
  }
}

/**
 * Middleware to validate request and handle errors
 * Should be used after express-validator rules
 *
 * Usage:
 * router.post('/route', [validationRules...], validate, controller);
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
export const validate = (req, res, next) => {
  // Get validation errors
  const errors = validationResult(req);

  // If no errors, continue to next middleware/controller
  if (errors.isEmpty()) {
    return next();
  }

  // Convert express-validator errors to our format
  const formattedErrors = errors.array().map((error) => ({
    field: error.param || error.path,
    message: error.msg,
    value: error.value,
  }));

  // Option 1: Use ValidationError class with next(error)
  const validationError = new ValidationError(formattedErrors);
  validationError.statusCode = 422;
  validationError.errors = formattedErrors;

  return next(validationError);

  // Option 2: Respond directly (alternative)
  // return ResponseHandler.validationError(
  //   res,
  //   'Validation failed',
  //   formattedErrors
  // );
};

/**
 * Alternative validation middleware that responds directly
 * Useful if you prefer not to use centralized error handler for validation
 *
 * Usage: Same as validate()
 */
export const validateAndRespond = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((error) => ({
    field: error.param || error.path,
    message: error.msg,
    value: error.value,
  }));

  return ResponseHandler.validationError(
    res,
    'Validation failed',
    formattedErrors
  );
};

/**
 * Custom validation error handler for use in controllers
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {boolean} True if validation failed (should return early)
 */
export const checkValidation = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
    }));

    ResponseHandler.validationError(res, 'Validation failed', formattedErrors);
    return true;
  }

  return false;
};

export default validate;
