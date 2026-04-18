import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import prisma from './lib/prisma.js';
import authRoutes from './src/routes/authRoutes.js';
import { vendorRouter, adminVendorRouter } from './src/routes/vendor.routes.js';
import produceRoutes from './src/routes/produce.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import rentalRoutes from './src/routes/rental.routes.js';
import plantTrackingRoutes from './src/routes/plantTracking.routes.js';
import communityRoutes from './src/routes/community.routes.js';
import { globalErrorHandler } from './src/middleware/errorHandler.js';
import { authLimiter, loginLimiter, registerLimiter } from './src/middleware/rateLimiter.js';
import ResponseHandler from './src/utils/responseHandler.js';
import { swaggerSpec } from './src/config/swagger.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware — CSP relaxed for script/style so Swagger UI can run under Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      },
    },
  })
);
app.use(cors()); // Cross-origin resource sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    return ResponseHandler.success(res, { database: 'connected' }, 'Health check passed', 200);
  } catch (error) {
    console.error('Health check failed:', error.message);
    return ResponseHandler.error(res, 'Database connection failed', 503);
  }
});

// API routes
// Auth routes (with rate limiting)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRouter);
app.use('/api/admin', adminVendorRouter);
app.use('/api/produce', produceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/plant-tracking', plantTrackingRoutes);
app.use('/api/community', communityRoutes);

// OpenAPI docs (interactive Swagger UI)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Export OpenAPI spec as raw JSON (for Postman, Swagger Editor, etc.)
app.get('/api/docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Alternative endpoint for OpenAPI JSON (some tools expect /api-docs.json or /openapi.json)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes will be mounted here
// Example: app.use('/api/v1/users', usersRouter);
// Example: app.use('/api/v1/products', productsRouter);

// 404 handler
app.use((req, res) => {
  return ResponseHandler.notFound(res, 'Endpoint not found');
});

// Centralized error handling middleware (MUST be last)
app.use(globalErrorHandler);

// Start server and test Prisma connection
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // Test database connection on startup
    await prisma.$connect();
    console.log('✅ Database connection established');

    app.listen(PORT, () => {
      console.log(`🚀 Urban Farming Platform API running on port ${PORT} (${NODE_ENV})`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
