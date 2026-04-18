/**
 * User Service
 * Contains all business logic for user-related operations
 * 
 * Pattern:
 * - Handles database operations via Prisma
 * - Implements validation and business rules
 * - Controllers call these methods
 * - Never directly exposes database errors to client
 */

import prisma from '../../lib/prisma.js';
import { paginate } from '../../lib/database.js';

class UserService {
  /**
   * Get all users with pagination
   */
  async getAllUsers(page = 1, limit = 10) {
    return await paginate('user', {}, page, limit, { createdAt: 'desc' });
  }

  /**
   * Get single user by ID
   */
  async getUserById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create new user
   * Validates email uniqueness and input
   */
  async createUser(userData) {
    try {
      // Validate input
      if (!userData.email || !userData.name) {
        throw new Error('Email and name are required');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
        },
      });

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user
   */
  async updateUser(id, updateData) {
    try {
      // Prevent email update to already-taken email
      if (updateData.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (emailTaken && emailTaken.id !== parseInt(id)) {
          throw new Error('This email is already taken');
        }
      }

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    try {
      const user = await prisma.user.delete({
        where: { id: parseInt(id) },
      });

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query) {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });

      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new UserService();
