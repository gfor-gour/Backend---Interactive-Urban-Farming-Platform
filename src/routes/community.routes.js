/**
 * Community forum — /api/community
 */

import express from 'express';
import { body, param, query, check } from 'express-validator';
import * as communityController from '../controllers/communityController.js';
import authenticate from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const listQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

/**
 * GET /api/community — public
 */
router.get('/', listQuery, validate, communityController.listPosts);

/**
 * POST /api/community — any authenticated role
 */
router.post(
  '/',
  authenticate,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('title is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('title must be 1–200 characters'),
    body('postContent')
      .trim()
      .notEmpty()
      .withMessage('postContent is required')
      .isLength({ min: 10, max: 20000 })
      .withMessage('postContent must be at least 10 characters and at most 20000'),
  ],
  validate,
  communityController.createPost
);

/**
 * GET /api/community/:id — public (after POST /)
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid post id')],
  validate,
  communityController.getPostById
);

/**
 * PUT /api/community/:id — own post only
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid post id'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('postContent')
      .optional()
      .trim()
      .isLength({ min: 10, max: 20000 })
      .withMessage('postContent must be at least 10 characters when provided'),
    check().custom((_, { req }) => {
      if (req.body.title === undefined && req.body.postContent === undefined) {
        throw new Error('Provide title and/or postContent');
      }
      return true;
    }),
  ],
  validate,
  communityController.updatePost
);

/**
 * DELETE /api/community/:id — own post or admin
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID().withMessage('Invalid post id')],
  validate,
  communityController.deletePost
);

export default router;
