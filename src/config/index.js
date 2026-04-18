
export default {
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    // Access token secret for short-lived tokens (15 minutes)
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      'your-super-secret-access-key-change-in-production',
    // Refresh token secret for long-lived tokens (7 days)
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'your-super-secret-refresh-key-change-in-production',
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};
