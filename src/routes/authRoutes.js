import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import authenticate from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

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


router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.getProfile);

export default router;
