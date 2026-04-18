
import { validationResult } from 'express-validator';
import ResponseHandler from '../utils/responseHandler.js';

export class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.statusCode = 422;
    this.errors = errors;
  }
}

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((error) => ({
    field: error.param || error.path,
    message: error.msg,
    value: error.value,
  }));

  const validationError = new ValidationError(formattedErrors);
  validationError.statusCode = 422;
  validationError.errors = formattedErrors;

  return next(validationError);
};

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
