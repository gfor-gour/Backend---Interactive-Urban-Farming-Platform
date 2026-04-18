
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import ResponseHandler from '../utils/responseHandler.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: false,
  skip: (req) => {
    return req.path === '/health';
  },
  handler: (req, res) => {
    return ResponseHandler.error(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429
    );
  },
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req);
  },
});


export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP.',
  standardHeaders: false,
  skip: (req) => {
    return req.path === '/health';
  },
  handler: (req, res) => {
    return ResponseHandler.error(
      res,
      'Too many requests. Please try again later.',
      429
    );
  },
});


export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5,
  message: 'Too many requests for this operation.',
  standardHeaders: false,
  handler: (req, res) => {
    return ResponseHandler.error(
      res,
      'Too many requests for this operation. Please try again later.',
      429
    );
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: 'Too many login attempts.',
  standardHeaders: false,
  keyGenerator: (req) => {
  
    return req.body?.email || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    return ResponseHandler.error(
      res,
      'Too many login attempts. Please try again after 15 minutes.',
      429
    );
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  message: 'Too many accounts created from this IP.',
  standardHeaders: false,
  handler: (req, res) => {
    return ResponseHandler.error(
      res,
      'Too many registration attempts. Please try again after 1 hour.',
      429
    );
  },
});

export default {
  authLimiter,
  generalLimiter,
  strictLimiter,
  loginLimiter,
  registerLimiter,
};
