/**
 * User Routes
 * Defines all user-related API endpoints
 * 
 * Pattern:
 * Routes → Controllers (request parsing) → Services (business logic)
 * No business logic in this file, only endpoint definitions
 */

import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (paginated)
 * @query   page=1 limit=10
 */
router.get('/', userController.getAllUsers.bind(userController));

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users by name or email
 * @query   q=searchterm
 */
router.get('/search', userController.searchUsers.bind(userController));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get single user by ID
 */
router.get('/:id', userController.getUserById.bind(userController));

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @body    { email, name }
 */
router.post('/', userController.createUser.bind(userController));

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @body    { email?, name? }
 */
router.put('/:id', userController.updateUser.bind(userController));

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 */
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;
