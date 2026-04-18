/**
 * Vendor & admin vendor routes
 * Mount vendorRouter at /api/vendors, adminVendorRouter at /api/admin
 */

import express from 'express';
import { body, param, query, check } from 'express-validator';
import * as vendorController from '../controllers/vendorController.js';
import * as adminVendorController from '../controllers/adminVendorController.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const vendorRouter = express.Router();
const adminVendorRouter = express.Router();

const farmNameRule = body('farmName')
  .trim()
  .notEmpty()
  .withMessage('Farm name is required')
  .isLength({ min: 2, max: 200 })
  .withMessage('Farm name must be 2–200 characters');

const farmLocationRule = body('farmLocation')
  .trim()
  .notEmpty()
  .withMessage('Farm location is required')
  .isLength({ min: 2, max: 500 })
  .withMessage('Farm location must be 2–500 characters');

const optionalLatLng = [
  body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
];

/**
 * POST /api/vendors/profile [VENDOR]
 */
vendorRouter.post(
  '/profile',
  authenticate,
  authorize('VENDOR'),
  [
    farmNameRule,
    farmLocationRule,
    ...optionalLatLng,
  ],
  validate,
  vendorController.createProfile
);

/**
 * PUT /api/vendors/profile [VENDOR]
 */
vendorRouter.put(
  '/profile',
  authenticate,
  authorize('VENDOR'),
  [
    body('farmName').optional().trim().isLength({ min: 2, max: 200 }),
    body('farmLocation').optional().trim().isLength({ min: 2, max: 500 }),
    ...optionalLatLng,
    check().custom((_, { req }) => {
      const { farmName, farmLocation, lat, lng } = req.body;
      const has =
        farmName !== undefined ||
        farmLocation !== undefined ||
        lat !== undefined ||
        lng !== undefined;
      if (!has) {
        throw new Error('At least one of farmName, farmLocation, lat, or lng is required');
      }
      return true;
    }),
  ],
  validate,
  vendorController.updateProfile
);

/**
 * POST /api/vendors/certifications [VENDOR]
 */
vendorRouter.post(
  '/certifications',
  authenticate,
  authorize('VENDOR'),
  [
    body('certifyingAgency')
      .trim()
      .notEmpty()
      .withMessage('Certifying agency is required')
      .isLength({ min: 2, max: 200 }),
    body('certificationDate')
      .notEmpty()
      .withMessage('certificationDate is required')
      .isISO8601()
      .withMessage('certificationDate must be a valid ISO 8601 date'),
    body('expiryDate')
      .notEmpty()
      .withMessage('expiryDate is required')
      .isISO8601()
      .withMessage('expiryDate must be a valid ISO 8601 date'),
    body('documentUrl')
      .optional({ values: 'null' })
      .isURL({ require_tld: false })
      .withMessage('documentUrl must be a valid URL'),
    body('expiryDate').custom((value, { req }) => {
      if (!req.body.certificationDate || !value) return true;
      if (new Date(value) <= new Date(req.body.certificationDate)) {
        throw new Error('expiryDate must be after certificationDate');
      }
      return true;
    }),
  ],
  validate,
  vendorController.submitCertification
);

/**
 * GET /api/vendors/:id [public]
 * Register after static segments so "profile" / "certifications" are not captured
 */
vendorRouter.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid vendor id')],
  validate,
  vendorController.getVendorById
);

// --- Admin (mount at /api/admin) ---

/**
 * GET /api/admin/vendors [ADMIN]
 */
adminVendorRouter.get(
  '/vendors',
  authenticate,
  authorize('ADMIN'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
    query('certificationStatus')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED'])
      .withMessage('certificationStatus must be PENDING, APPROVED, or REJECTED'),
  ],
  validate,
  adminVendorController.listVendors
);

/**
 * PATCH /api/admin/vendors/:id/status [ADMIN]
 * :id = vendor User.id
 */
adminVendorRouter.patch(
  '/vendors/:id/status',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID().withMessage('Invalid user id'),
    body('status')
      .notEmpty()
      .withMessage('status is required')
      .isIn(['ACTIVE', 'SUSPENDED', 'PENDING'])
      .withMessage('status must be ACTIVE, SUSPENDED, or PENDING'),
  ],
  validate,
  adminVendorController.patchVendorUserStatus
);

/**
 * PATCH /api/admin/certifications/:id [ADMIN]
 */
adminVendorRouter.patch(
  '/certifications/:id',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isUUID().withMessage('Invalid certification id'),
    body('status')
      .notEmpty()
      .withMessage('status is required')
      .isIn(['APPROVED', 'REJECTED'])
      .withMessage('status must be APPROVED or REJECTED'),
  ],
  validate,
  adminVendorController.patchCertificationStatus
);

export { vendorRouter, adminVendorRouter };
export default vendorRouter;
