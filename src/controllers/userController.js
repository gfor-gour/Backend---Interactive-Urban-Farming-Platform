import userService from '../services/userService.js';

class UserController {
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
