import jwt from 'jsonwebtoken';
import config from '../src/config/index.js';

const JWT_ACCESS_SECRET = config.jwt.accessSecret;
const JWT_REFRESH_SECRET = config.jwt.refreshSecret;
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days


export const signAccessToken = (payload) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
};


export const signRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
};


export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
  });
};


export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    algorithms: ['HS256'],
  });
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
