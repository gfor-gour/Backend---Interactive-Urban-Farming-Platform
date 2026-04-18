/**
 * JWT Utility Module
 * Handles JWT token generation and verification
 */

import jwt from 'jsonwebtoken';
import config from '../src/config/index.js';

const JWT_ACCESS_SECRET = config.jwt.accessSecret;
const JWT_REFRESH_SECRET = config.jwt.refreshSecret;
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Sign an access token with user data
 * @param {Object} payload - User data to sign (id, email, role, etc)
 * @returns {string} Signed JWT access token
 */
export const signAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
};

/**
 * Sign a refresh token with user data
 * @param {Object} payload - User data to sign (id, email, etc)
 * @returns {string} Signed JWT refresh token
 */
export const signRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
};

/**
 * Verify an access token
 * @param {string} token - Token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
  });
};

/**
 * Verify a refresh token
 * @param {string} token - Token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    algorithms: ['HS256'],
  });
};

/**
 * Decode a token without verification (useful for debugging)
 * @param {string} token - Token to decode
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
