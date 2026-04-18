/**
 * Produce marketplace routes — /api/produce
 */

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

/**
 * @swagger
 * /produce:
 *   get:
 *     tags: [Produce]
 *     summary: List produce (public catalog)
 *     description: Paginated marketplace catalog with optional filters.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Page size
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category name
 *         example: Leafy greens
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 0
 *         description: Minimum unit price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 0
 *         description: Maximum unit price
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vendor
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location text filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, createdAt, name]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       '200':
 *         description: Paginated list of produce
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data, meta]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Produce retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         example: Heirloom tomatoes
 *                       price:
 *                         type: number
 *                         example: 4.99
 *                       category:
 *                         type: string
 *                       availableQuantity:
 *                         type: integer
 *                         example: 25
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               success: true
 *               message: Produce retrieved successfully
 *               data:
 *                 - id: 660e8400-e29b-41d4-a716-446655440001
 *                   name: Heirloom tomatoes
 *                   price: 4.99
 *                   category: Vegetables
 *                   availableQuantity: 25
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 42
 *                 totalPages: 5
 *                 pages: 5
 *                 hasNextPage: true
 *                 hasPreviousPage: false
 *       '400':
 *         description: Bad request (e.g. some database or client errors)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: Invalid query parameters (express-validator)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Validation failed
 *               errors:
 *                 - field: page
 *                   message: page must be a positive integer
 *       '401':
 *         description: Not required for this public endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Not used for public catalog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Not used for collection listing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Not typical for GET list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '429':
 *         description: Optional global rate limit if enabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', listQuery, validate, produceController.listProduce);

/**
 * GET /api/produce/:id — public detail
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid produce id')],
  validate,
  produceController.getProduceById
);

/**
 * POST /api/produce — vendor, vendor certification APPROVED
 */
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

/**
 * PUT /api/produce/:id — vendor, own produce
 */
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

/**
 * DELETE /api/produce/:id — vendor (own) or admin — soft delete
 */
router.delete(
  '/:id',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  [param('id').isUUID().withMessage('Invalid produce id')],
  validate,
  produceController.removeProduce
);

export default router;
