/**
 * Plant tracking routes — /api/plant-tracking
 *
 * GET /:bookingId and PATCH /:id use the same path shape but different HTTP methods
 * (booking id vs plant-tracking row id).
 */

import express from 'express';
import { body, param, check } from 'express-validator';
import * as plantTrackingController from '../controllers/plantTrackingController.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const HEALTH_STATUSES = [
  'HEALTHY',
  'NEEDS_ATTENTION',
  'CRITICAL',
  'STRUGGLING',
  'HARVEST_READY',
];

/**
 * POST /api/plant-tracking — log update
 */
router.post(
  '/',
  authenticate,
  authorize('CUSTOMER'),
  [
    body('rentalBookingId').isUUID().withMessage('rentalBookingId must be a valid UUID'),
    body('plantName')
      .trim()
      .notEmpty()
      .withMessage('plantName is required')
      .isLength({ max: 200 }),
    body('healthStatus')
      .notEmpty()
      .withMessage('healthStatus is required')
      .isIn(HEALTH_STATUSES)
      .withMessage(`healthStatus must be one of: ${HEALTH_STATUSES.join(', ')}`),
    body('notes').optional({ values: 'null' }).isString().isLength({ max: 5000 }),
  ],
  validate,
  plantTrackingController.createLog
);

/**
 * PATCH /api/plant-tracking/:id — update plant log entry (before GET /:bookingId so "history" is not ambiguous)
 * Register PATCH before GET if same segment — actually both /:x — order: POST /, PATCH /:id, GET /:bookingId
 * Express matches method first; PATCH :id vs GET :bookingId are different methods.
 * Use PATCH first to avoid any ambiguity with static routes — none.
 */
router.patch(
  '/:id',
  authenticate,
  authorize('CUSTOMER'),
  [
    param('id').isUUID().withMessage('Invalid plant tracking id'),
    body('healthStatus')
      .optional()
      .isIn(HEALTH_STATUSES)
      .withMessage(`healthStatus must be one of: ${HEALTH_STATUSES.join(', ')}`),
    body('notes').optional({ values: 'null' }).isString().isLength({ max: 5000 }),
    check().custom((_, { req }) => {
      if (req.body.healthStatus === undefined && req.body.notes === undefined) {
        throw new Error('Provide healthStatus and/or notes');
      }
      return true;
    }),
  ],
  validate,
  plantTrackingController.patchEntry
);

/**
 * GET /api/plant-tracking/:bookingId — history for a rental booking
 */
router.get(
  '/:bookingId',
  authenticate,
  authorize('CUSTOMER'),
  [param('bookingId').isUUID().withMessage('Invalid booking id')],
  validate,
  plantTrackingController.getHistory
);

export default router;
