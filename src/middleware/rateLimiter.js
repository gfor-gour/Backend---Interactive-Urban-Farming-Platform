/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and DoS attacks
 * Uses express-rate-limit for flexible configuration
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import ResponseHandler from '../utils/responseHandler.js';

/**
 * Auth routes limiter
 * 10 requests per 15 minutes (aggressive for security)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: false, // Don't return rate limit info in headers
  skip: (req) => {
    // Skip rate limiting for health checks and other safe endpoints
    return req.path === '/health';
  },
  handler: (req, res) => {
    return ResponseHandler.error(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429
    );
  },
  // Use IP address for rate limiting (or user ID if authenticated)
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req);
  },
});

/**
 * General API limiter
 * 100 requests per minute
 */
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP.',
  standardHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
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

/**
 * Strict limiter for sensitive operations
 * 5 requests per hour
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per windowMs
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

/**
 * Login-specific limiter
 * 5 requests per 15 minutes per email
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts.',
  standardHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email address if provided, otherwise by IP
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

/**
 * Register-specific limiter
 * 3 accounts per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations
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
