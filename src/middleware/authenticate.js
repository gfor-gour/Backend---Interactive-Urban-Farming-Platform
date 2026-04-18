/**
 * Authentication Middleware
 * Verifies JWT access token from Authorization header
 * Attaches user data to req.user
 */

import { verifyAccessToken } from '../../lib/jwt.js';
import { AuthenticationError } from '../utils/errors.js';

/**
 * Middleware to authenticate JWT access token
 * Expects: Authorization: Bearer <token>
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach decoded user to request

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // JWT verification errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

export default authenticate;
