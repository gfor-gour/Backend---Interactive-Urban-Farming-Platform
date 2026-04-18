/**
 * Authentication Controller
 * Handles HTTP requests for auth endpoints
 * Delegates business logic to authService
 */

import * as authService from '../services/authService.js';
import ResponseHandler from '../utils/responseHandler.js';

/**
 * POST /api/auth/register
 * Register a new user
 * Validation: validate middleware (must be before this handler)
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Call service
    const { user, accessToken, refreshToken } = await authService.registerUser({
      name,
      email,
      password,
      role,
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/api/auth',
    });

    return ResponseHandler.created(res, { user, accessToken }, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login user with email and password
 * Validation: validate middleware (must be before this handler)
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Call service
    const { user, accessToken, refreshToken } = await authService.loginUser(
      email,
      password
    );

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/api/auth',
    });

    return ResponseHandler.success(res, { user, accessToken }, 'User logged in successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return ResponseHandler.unauthorized(res, 'Refresh token not found. Please login first');
    }

    // Call service
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAccessToken(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/api/auth',
    });

    return ResponseHandler.success(res, { accessToken }, 'Access token refreshed successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Logout user by clearing refresh token cookie
 */
export const logout = async (req, res, next) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/api/auth',
    });

    return ResponseHandler.success(res, null, 'User logged out successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 * Requires: authenticate middleware
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);

    return ResponseHandler.success(res, { user }, 'User profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
