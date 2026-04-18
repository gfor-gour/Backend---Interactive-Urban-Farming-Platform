/**
 * Order routes — /api/orders
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import * as orderController from '../controllers/orderController.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place an order (customer)
 *     description: Creates an order for a produce line item; stock is decremented atomically.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [produceId, quantity]
 *             properties:
 *               produceId:
 *                 type: string
 *                 format: uuid
 *                 example: 660e8400-e29b-41d4-a716-446655440001
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       '201':
 *         description: Order created
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
 *                         order:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             customerId:
 *                               type: string
 *                               format: uuid
 *                             produceId:
 *                               type: string
 *                               format: uuid
 *                             quantity:
 *                               type: integer
 *                             totalPrice:
 *                               type: number
 *                             status:
 *                               type: string
 *                               example: PENDING
 *             example:
 *               success: true
 *               message: Order placed successfully
 *               data:
 *                 order:
 *                   id: 770e8400-e29b-41d4-a716-446655440002
 *                   customerId: 550e8400-e29b-41d4-a716-446655440000
 *                   produceId: 660e8400-e29b-41d4-a716-446655440001
 *                   quantity: 2
 *                   totalPrice: 9.98
 *                   status: PENDING
 *       '400':
 *         description: Bad request (e.g. invalid foreign key / Prisma client errors)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '422':
 *         description: Validation error (invalid UUID, quantity, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Validation failed
 *               errors:
 *                 - field: quantity
 *                   message: quantity must be a positive integer
 *       '401':
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Unauthorized
 *       '403':
 *         description: Authenticated but not allowed (e.g. not a CUSTOMER)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Forbidden
 *       '404':
 *         description: Produce or related record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Resource not found
 *       '409':
 *         description: Business conflict — e.g. insufficient stock for requested quantity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Insufficient stock for the requested quantity
 *       '429':
 *         description: Too many requests (if rate limiting applies)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Too many requests. Please try again later.
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
  '/',
  authenticate,
  authorize('CUSTOMER'),
  [
    body('produceId').isUUID().withMessage('produceId must be a valid UUID'),
    body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
  ],
  validate,
  orderController.createOrder
);

/**
 * GET /api/orders — customer: own; vendor: their produce; admin: all
 */
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  orderController.listOrders
);

/**
 * PATCH /api/orders/:id/status — vendor (own line) or admin
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  [
    param('id').isUUID().withMessage('Invalid order id'),
    body('status')
      .notEmpty()
      .withMessage('status is required')
      .isIn(['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'])
      .withMessage('status must be a valid order status'),
  ],
  validate,
  orderController.patchOrderStatus
);

export default router;
