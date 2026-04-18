/**
 * Authorization Middleware Factory
 * Checks user role against required roles
 * Must be used AFTER authenticate middleware
 */

import { AuthorizationError } from '../utils/errors.js';

/**
 * Factory function to create authorization middleware for specific roles
 * @param {...string} allowedRoles - Array of role strings (e.g., 'ADMIN', 'VENDOR')
 * @returns {Function} Middleware function
 * 
 * Usage: app.post('/admin/users', authorize('ADMIN'), controllerFn)
 *        app.post('/vendor/products', authorize('VENDOR', 'ADMIN'), controllerFn)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AuthorizationError('User not authenticated');
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      res.status(403).json({
        success: false,
        message: 'Authorization failed',
      });
    }
  };
};

export default authorize;
