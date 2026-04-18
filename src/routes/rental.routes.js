import express from 'express';
import { body, param, query, check } from 'express-validator';
import * as rentalController from '../controllers/rentalController.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const listQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('location').optional().isString().trim().isLength({ max: 500 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('size').optional().isString().trim().isLength({ min: 1, max: 120 }),
];

router.get('/', listQuery, validate, rentalController.listSpaces);

router.get(
  '/bookings',
  authenticate,
  authorize('CUSTOMER'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  rentalController.listMyBookings
);

router.post(
  '/',
  authenticate,
  authorize('VENDOR'),
  [
    body('location')
      .trim()
      .notEmpty()
      .withMessage('location is required')
      .isLength({ min: 1, max: 500 }),
    body('size')
      .trim()
      .notEmpty()
      .withMessage('size is required')
      .isLength({ min: 1, max: 120 }),
    body('pricePerMonth')
      .notEmpty()
      .withMessage('pricePerMonth is required')
      .isFloat({ min: 0 })
      .withMessage('pricePerMonth must be a non-negative number'),
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
  ],
  validate,
  rentalController.createSpace
);


router.post(
  '/:id/book',
  authenticate,
  authorize('CUSTOMER'),
  [
    param('id').isUUID().withMessage('Invalid rental space id'),
    body('startDate')
      .notEmpty()
      .withMessage('startDate is required')
      .isISO8601()
      .withMessage('startDate must be ISO 8601'),
    body('endDate')
      .notEmpty()
      .withMessage('endDate is required')
      .isISO8601()
      .withMessage('endDate must be ISO 8601'),
  ],
  validate,
  rentalController.bookSpace
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid rental space id')],
  validate,
  rentalController.getSpaceById
);


router.put(
  '/:id',
  authenticate,
  authorize('VENDOR'),
  [
    param('id').isUUID().withMessage('Invalid rental space id'),
    body('location').optional().trim().isLength({ min: 1, max: 500 }),
    body('size').optional().trim().isLength({ min: 1, max: 120 }),
    body('pricePerMonth').optional().isFloat({ min: 0 }),
    body('isAvailable').optional().isBoolean(),
    check().custom((_, { req }) => {
      const keys = ['location', 'size', 'pricePerMonth', 'isAvailable'];
      const has = keys.some((k) => req.body[k] !== undefined);
      if (!has) {
        throw new Error('At least one of location, size, pricePerMonth, or isAvailable is required');
      }
      return true;
    }),
  ],
  validate,
  rentalController.updateSpace
);

export default router;
