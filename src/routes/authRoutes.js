/**
 * Authentication Routes
 * Handles all auth endpoints
 */

import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import authenticate from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a user account, sets an httpOnly refresh cookie, and returns access token plus user profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Urban Grower
 *               email:
 *                 type: string
 *                 format: email
 *                 example: grower@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Min 8 chars; must include uppercase, lowercase, and digit
 *                 example: Str0ngPass
 *               role:
 *                 type: string
 *                 enum: [ADMIN, VENDOR, CUSTOMER]
 *                 example: CUSTOMER
 *     responses:
 *       '201':
 *         description: User created; refresh token set in httpOnly cookie
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             id: { type: string, format: uuid }
 *                             name: { type: string }
 *                             email: { type: string }
 *                             role: { type: string, enum: [ADMIN, VENDOR, CUSTOMER] }
 *                         accessToken:
 *                           type: string
 *                           description: JWT access token (use as Bearer)
 *             example:
 *               success: true
 *               message: User registered successfully
 *               data:
 *                 user:
 *                   id: 550e8400-e29b-41d4-a716-446655440000
 *                   name: Urban Grower
 *                   email: grower@example.com
 *                   role: CUSTOMER
 *                 accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       '400':
 *         description: Bad request (non-validation failures when applicable)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: express-validator validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Validation failed
 *               errors:
 *                 - field: password
 *                   message: Password must contain uppercase, lowercase, and number
 *       '401':
 *         description: Not used for registration (no credentials required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Unauthorized
 *       '403':
 *         description: Not typical for register; reserved for policy-based rejection
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Forbidden
 *       '404':
 *         description: Not applicable to this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Email (or unique field) already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email already exists
 *               errors:
 *                 - field: email
 *                   message: This email is already in use
 *       '429':
 *         description: Too many registration attempts from this IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Too many registration attempts. Please try again after 1 hour.
 *       '500':
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Internal server error
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain uppercase, lowercase, and number'
      ),
    body('role')
      .isIn(['ADMIN', 'VENDOR', 'CUSTOMER'])
      .withMessage('Role must be ADMIN, VENDOR, or CUSTOMER'),
  ],
  validate,
  authController.register
);

/**
 * POST /api/auth/login
 * Login user
 * Body: { email, password }
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validate,
  authController.login
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authController.logout);

/**
 * GET /api/auth/me
 * Get current user profile
 * Protected: Requires authentication
 */
router.get('/me', authenticate, authController.getProfile);

export default router;
