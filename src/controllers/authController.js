
import * as authService from '../services/authService.js';
import ResponseHandler from '../utils/responseHandler.js';


export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const { user, accessToken, refreshToken } = await authService.registerUser({
      name,
      email,
      password,
      role,
    });

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


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await authService.loginUser(
      email,
      password
    );

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


export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return ResponseHandler.unauthorized(res, 'Refresh token not found. Please login first');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAccessToken(refreshToken);

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


export const logout = async (req, res, next) => {
  try {

    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/api/auth',
    });

    return ResponseHandler.success(res, null, 'User logged out successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);

    return ResponseHandler.success(res, { user }, 'User profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
