/**
 * Authentication Service
 * Handles business logic for auth operations
 */

import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken } from '../../lib/jwt.js';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
} from '../utils/errors.js';

const BCRYPT_ROUNDS = 10;

/**
 * Register a new user
 * @param {Object} data - { name, email, password, role }
 * @returns {Object} { user, accessToken, refreshToken }
 */
export const registerUser = async (data) => {
  const { name, email, password, role } = data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  return { user, accessToken, refreshToken };
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} { user, accessToken, refreshToken }
 */
export const loginUser = async (email, password) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Select safe fields to return
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  return { user: safeUser, accessToken, refreshToken };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token from user
 * @returns {Object} { accessToken, refreshToken (new) }
 */
export const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token - this will throw if invalid/expired
  let decoded;
  try {
    const { verifyRefreshToken } = await import('../../lib/jwt.js');
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  // Fetch fresh user data
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Generate new tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  const newAccessToken = signAccessToken(tokenPayload);
  const newRefreshToken = signRefreshToken(tokenPayload);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User data (safe fields)
 */
export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};
