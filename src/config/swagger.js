import path from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Urban Farming API',
    version: '1.0.0',
    description:
      'REST API for the Urban Farming platform. Authenticated routes use `Authorization: Bearer <accessToken>`.',
  },
  servers: [{ url: '/api', description: 'API base (same origin)' }],
  tags: [
    { name: 'Auth', description: 'Registration, login, refresh, logout, profile' },
    { name: 'Vendors', description: 'Vendor profiles and marketplace presence' },
    { name: 'Produce', description: 'Produce catalog and vendor listings' },
    { name: 'Orders', description: 'Customer orders and fulfillment' },
    { name: 'Rentals', description: 'Equipment and space rentals' },
    { name: 'PlantTracking', description: 'Plant growth and tracking' },
    { name: 'Community', description: 'Community posts and engagement' },
    { name: 'Admin', description: 'Administrative vendor and platform operations' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Short-lived access token from login or register response.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        required: ['success', 'message'],
      },
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
        required: ['success', 'message'],
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
          pages: { type: 'integer', example: 5 },
          hasNextPage: { type: 'boolean', example: true },
          hasPreviousPage: { type: 'boolean', example: false },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [path.join(__dirname, '../routes/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
