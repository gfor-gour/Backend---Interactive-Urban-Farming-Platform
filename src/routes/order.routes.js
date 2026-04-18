
import express from 'express';
import { body, param, query } from 'express-validator';
import * as orderController from '../controllers/orderController.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

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
