/**
 * User Controller
 * Handles HTTP request/response parsing
 * Delegates business logic to UserService
 * 
 * Key principles:
 * - No business logic here
 * - Only parse requests and format responses
 * - Call service methods
 * - Return appropriate HTTP status codes
 */

import userService from '../services/userService.js';

class UserController {
  /**
   * GET /api/v1/users
   * Get all users with pagination
   */
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await userService.getAllUsers(page, limit);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(200).json({
        success: true,
        data: result.data.data,
        pagination: result.data.pagination,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  /**
   * GET /api/v1/users/:id
   * Get single user by ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.getUserById(id);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  /**
   * POST /api/v1/users
   * Create new user
   */
  async createUser(req, res) {
    try {
      const { email, name } = req.body;

      const result = await userService.createUser({ email, name });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({ success: true, data: result.data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  /**
   * PUT /api/v1/users/:id
   * Update user
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await userService.updateUser(id, updateData);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Delete user
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const result = await userService.deleteUser(id);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * GET /api/v1/users/search?q=query
   * Search users
   */
  async searchUsers(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      const result = await userService.searchUsers(q);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to search users' });
    }
  }
}

export default new UserController();
