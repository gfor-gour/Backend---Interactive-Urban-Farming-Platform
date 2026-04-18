
import express from 'express';
import { body, param, query, check } from 'express-validator';
import * as produceController from '../controllers/produceController.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const listQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
  query('category').optional().isString().trim().isLength({ min: 1, max: 120 }),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be a non-negative number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be a non-negative number'),
  query('vendorId').optional().isUUID().withMessage('vendorId must be a valid UUID'),
  query('location').optional().isString().trim().isLength({ max: 500 }),
  query('sortBy')
    .optional()
    .isIn(['price', 'createdAt', 'name'])
    .withMessage('sortBy must be price, createdAt, or name'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
];


router.get('/', listQuery, validate, produceController.listProduce);


router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid produce id')],
  validate,
  produceController.getProduceById
);

router.post(
  '/',
  authenticate,
  authorize('VENDOR'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('name is required')
      .isLength({ min: 1, max: 200 }),
    body('description').optional({ values: 'null' }).isString().isLength({ max: 5000 }),
    body('price')
      .notEmpty()
      .withMessage('price is required')
      .isFloat({ min: 0 })
      .withMessage('price must be a non-negative number'),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('category is required')
      .isLength({ min: 1, max: 120 }),
    body('availableQuantity')
      .isInt({ min: 0 })
      .withMessage('availableQuantity must be a non-negative integer'),
    body('certificationStatus')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED'])
      .withMessage('certificationStatus must be PENDING, APPROVED, or REJECTED'),
  ],
  validate,
  produceController.createProduce
);


router.put(
  '/:id',
  authenticate,
  authorize('VENDOR'),
  [
    param('id').isUUID().withMessage('Invalid produce id'),
    body('name').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional({ values: 'null' }).isString().isLength({ max: 5000 }),
    body('price').optional().isFloat({ min: 0 }),
    body('category').optional().trim().isLength({ min: 1, max: 120 }),
    body('availableQuantity').optional().isInt({ min: 0 }),
    body('certificationStatus')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED'])
      .withMessage('certificationStatus must be PENDING, APPROVED, or REJECTED'),
    check().custom((_, { req }) => {
      const keys = [
        'name',
        'description',
        'price',
        'category',
        'availableQuantity',
        'certificationStatus',
      ];
      const has = keys.some((k) => req.body[k] !== undefined);
      if (!has) {
        throw new Error('At least one updatable field is required');
      }
      return true;
    }),
  ],
  validate,
  produceController.updateProduce
);


router.delete(
  '/:id',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  [param('id').isUUID().withMessage('Invalid produce id')],
  validate,
  produceController.removeProduce
);

export default router;
