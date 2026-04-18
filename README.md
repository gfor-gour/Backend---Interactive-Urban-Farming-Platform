# Urban Farming Platform - Backend API

**A production-ready Express.js + Prisma + PostgreSQL REST API for urban farming operations**

Complete, deployable backend featuring JWT authentication, role-based access control, comprehensive error handling, rate limiting, and performance optimization. Built with industry best practices and fully documented.

---

## 🎯 Key Features

✅ **Complete JWT Authentication System**
- Access tokens (15 min) + Refresh tokens (7 days) with httpOnly cookies
- bcrypt password hashing (10 rounds)
- Role-based access control (ADMIN, VENDOR, CUSTOMER)
- 5 authentication endpoints ready to use

✅ **Production-Ready Utilities**
- Centralized response handler (consistent JSON envelope)
- Global error middleware (catches all unhandled rejections)
- Rate limiting (auth: 10/15min, login: 5/15min, general: 100/min)
- Input validation with express-validator
- Prisma ORM with optimized queries

✅ **Security & Performance**
- Password hashing with bcrypt
- HTTPS-enforced cookies in production
- CORS + Helmet security headers
- Index strategy for fast queries (email, vendorId, userId)
- Pagination support (default 10, max 100 items)
- N+1 query prevention with Prisma `include`

✅ **Well-Documented**
- Comprehensive guides: AUTHENTICATION.md, UTILITIES.md, PRISMA_SETUP.md
- Performance strategy & benchmark reports
- Quick start guides with cURL examples
- Inline code comments and JSDoc

---

## 📁 Project Structure

```
.
├── app.js                           # Express app initialization & middleware setup
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config (optional)
├── .env.example                     # Environment template
│
├── lib/
│   ├── jwt.js                       # Token generation & verification
│   ├── prisma.js                    # Prisma client singleton
│   └── database.js                  # Database initialization
│
├── prisma/
│   ├── schema.prisma                # Database schema (User, Produce, Vendor, etc.)
│   ├── seed.js                      # Database seeding (test data)
│   └── migrations/                  # Database migration history
│
├── src/
│   ├── config/
│   │   ├── index.js                 # JWT secrets & environment config
│   │   └── swagger.js               # API documentation config
│   │
│   ├── middleware/
│   │   ├── authenticate.js          # JWT Bearer token verification
│   │   ├── authorize.js             # Role-based access control factory
│   │   ├── errorHandler.js          # Global error middleware (catches all errors)
│   │   ├── rateLimiter.js           # Rate limiting (5 different limiters)
│   │   ├── validate.js              # Validation middleware wrapper
│   │   └── index.js                 # Middleware exports
│   │
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints: register, login, refresh, logout, me
│   │   ├── userRoutes.js            # User management endpoints
│   │   ├── vendor.routes.js         # Vendor endpoints
│   │   ├── produce.routes.js        # Produce management endpoints
│   │   ├── order.routes.js          # Order management
│   │   ├── rental.routes.js         # Equipment rental
│   │   ├── community.routes.js      # Community features
│   │   ├── plantTracking.routes.js  # Plant tracking
│   │   └── index.js                 # Route exports
│   │
│   ├── controllers/
│   │   ├── authController.js        # Auth logic (register, login, refresh, logout, me)
│   │   ├── userController.js        # User operations
│   │   ├── vendorController.js      # Vendor operations
│   │   ├── produceController.js     # Produce operations
│   │   ├── orderController.js       # Order operations
│   │   ├── rentalController.js      # Rental operations
│   │   ├── communityController.js   # Community operations
│   │   ├── plantTrackingController.js # Plant tracking operations
│   │   └── index.js                 # Controller exports
│   │
│   ├── services/
│   │   ├── authService.js           # Auth business logic (register, login, refresh)
│   │   ├── userService.js           # User business logic
│   │   ├── vendorService.js         # Vendor business logic
│   │   ├── produceService.js        # Produce business logic
│   │   ├── orderService.js          # Order business logic
│   │   ├── rentalService.js         # Rental business logic
│   │   ├── communityService.js      # Community business logic
│   │   ├── plantTrackingService.js  # Plant tracking business logic
│   │   └── index.js                 # Service exports
│   │
│   └── utils/
│       ├── errors.js                # Custom error classes & error factory
│       ├── responseHandler.js       # Standardized response formatter
│       └── index.js                 # Utility exports
│
└── docs/
    ├── DATABASE.md              # Database setup & migration guide
    ├── PERFORMANCE_STRATEGY.md                    # Query optimization & architecture
    ├── BENCHMARK_REPORT.md                        # Performance test results
    
```

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository
git clone <repository-url>
cd urban-farming-api

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database URL and JWT secrets
# DATABASE_URL=postgresql://user:password@localhost:5432/urban_farming_db
# JWT_ACCESS_SECRET=<random-32-character-string>
# JWT_REFRESH_SECRET=<random-32-character-string>
```

### 3. Database Setup

```bash
# Run migrations
npm run prisma:migrate:dev

# Seed test data (creates admin, vendors, customers)
npm run prisma:seed

# Or setup everything in one command
npm run db:setup
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

### 5. Test Authentication

```bash
# Login with test admin account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@farm.com",
    "password": "admin@123"
  }'

# Response includes accessToken - use in Authorization header
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## 🔐 Authentication System

### Overview

Complete JWT authentication with two-token strategy:

| Token | Lifetime | Storage | Use |
|-------|----------|---------|-----|
| **Access Token** | 15 minutes | Response body | API requests (Bearer header) |
| **Refresh Token** | 7 days | httpOnly cookie | Get new access token |

### Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | ❌ | Create new user account |
| POST | `/api/auth/login` | ❌ | Authenticate & get tokens |
| POST | `/api/auth/refresh` | 🍪 Cookie | Get new access token |
| POST | `/api/auth/logout` | ❌ | Clear refresh token |
| GET | `/api/auth/me` | ✅ Bearer | Get current user profile |

Legend: ❌ No auth | 🍪 Cookie-based | ✅ Bearer token

### Register Example

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "role": "CUSTOMER"
  }'
```

**Validation Rules:**
- `name`: 2-100 characters
- `email`: Valid unique email
- `password`: Min 8 chars, must contain uppercase, lowercase, number
- `role`: ADMIN, VENDOR, or CUSTOMER

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "createdAt": "2026-04-18T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Protecting Routes

```javascript
import authenticate from './src/middleware/authenticate.js';
import { authorize } from './src/middleware/authorize.js';

// Requires valid Bearer token
app.get('/api/profile', authenticate, userController.getProfile);

// Only ADMIN users
app.delete('/api/users/:id', authenticate, authorize('ADMIN'), userController.deleteUser);

// ADMIN or VENDOR
app.post('/api/products', authenticate, authorize('ADMIN', 'VENDOR'), productController.create);
```

### Frontend Integration Example

**Auto-refresh flow with token expiry handling:**

```javascript
// Store access token in memory (not localStorage for security)
let accessToken = null;

async function apiCall(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Send httpOnly cookies
  });

  // Token expired, refresh automatically
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (refreshResponse.ok) {
      const { data } = await refreshResponse.json();
      accessToken = data.accessToken;
      
      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
    } else {
      // Session expired, redirect to login
      window.location.href = '/login';
    }
  }

  return response.json();
}

// Usage: automatically handles token refresh
const profile = await apiCall('/api/auth/me');
```

---

## 📊 Response Format

All endpoints return consistent JSON structure:

### Success Response (200/201)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": { ... },
    "accessToken": "..."
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Items retrieved",
  "data": [ ... items ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 245,
    "pages": 25,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required",
      "value": "not-email"
    }
  ]
}
```

---

## � API Documentation Endpoints

Three endpoints serve the OpenAPI specification in different formats:

### Interactive Swagger UI
```
GET http://localhost:3000/api/docs
```
Opens interactive API documentation in the browser. You can read the spec and test endpoints directly.

### Raw OpenAPI JSON
```
GET http://localhost:3000/api/docs-json
```
Returns the OpenAPI spec as JSON. Use this endpoint for programmatic access or to export the spec.

**Export via curl:**
```bash
curl http://localhost:3000/api/docs-json | jq > docs/openapi.json
```

### Alternative JSON Endpoint
```
GET http://localhost:3000/api-docs.json
```
Alternative endpoint name (for tools that expect this convention).

---

## �🛡️ Security Features

✅ **Authentication & Authorization**
- JWT-based authentication with short-lived tokens
- Role-based access control (RBAC)
- Refresh token rotation capability
- Password hashing with bcrypt (10 rounds)

✅ **API Protection**
- Rate limiting on auth endpoints (10/15min)
- Login attempt limiting (5/15min per email)
- Registration limiting (3/hour per IP)
- CORS configured with origin whitelist
- Helmet security headers enabled

✅ **Data Security**
- HTTPS-enforced cookies in production
- SameSite=Strict cookie policy (CSRF protection)
- httpOnly cookies (XSS protection)
- No passwords in logs or responses

✅ **Error Handling**
- Centralized error middleware catches all exceptions
- No stack traces exposed in production
- Consistent error format prevents information leakage
- Prevents unhandled rejections from crashing server

---

## ⚡ Performance & Optimization

### Database Optimization

- **Indexes**: Applied to `email` (UNIQUE), `vendorId`, `userId` for fast lookups
- **Query Optimization**: Field selection with `select`, relationship batching with `include`
- **N+1 Prevention**: Related data loaded in single query, not separate loops
- **Connection Pooling**: Configured for concurrent request handling

### Response Optimization

- **Pagination**: Default 10 items, max 100 to limit response size
- **Field Selection**: Endpoint returns only necessary fields
- **Consistent Handler**: Single response formatter for predictable parsing

### Rate Limiting

Prevents abuse and ensures fair resource usage:

```javascript
// Authentication routes: 10 requests per 15 minutes
authLimiter: 10 requests / 15 minutes

// Login endpoint: 5 attempts per 15 minutes per email
loginLimiter: 5 attempts / 15 min

// Registration: 3 new accounts per hour per IP
registerLimiter: 3 accounts / 1 hour

// General API routes: 100 requests per minute
generalLimiter: 100 requests / 1 minute
```

### Benchmark Results

Tested with autocannon (10 concurrent connections, 10 seconds):

```
Before Optimization:  58.4 req/sec, 142ms avg latency, 312ms p95
After Optimization:   92.3 req/sec,  87ms avg latency, 156ms p95
Improvement:          +58% throughput, -39% latency
```

See [BENCHMARK_REPORT.md](BENCHMARK_REPORT.md) for detailed analysis.

---

## 📚 Environment Variables

### Required

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/urban_farming_db

# JWT Secrets (use strong random strings in production)
JWT_ACCESS_SECRET=your-random-32-char-access-secret-here
JWT_REFRESH_SECRET=your-random-32-char-refresh-secret-here

# Environment
NODE_ENV=development
```

### Optional

```env
# Server
PORT=3000

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging (development)
LOG_LEVEL=debug
```

---

## 📖 Detailed Documentation

Comprehensive guides available in the docs folder:

| Document | Purpose | Audience |
|----------|---------|----------|
| [**AUTHENTICATION.md**](AUTHENTICATION.md) | Complete auth guide: token strategy, all endpoints, error codes, debugging | Backend developers, integrators |
| [**UTILITIES.md**](UTILITIES.md) | API patterns: response format, error handling, rate limiting, validation | All developers, QA |
| [**PRISMA_SETUP.md**](PRISMA_SETUP.md) | Database operations: setup, migrations, connection pooling, queries | Backend developers, DevOps |
| [**PERFORMANCE_STRATEGY.md**](PERFORMANCE_STRATEGY.md) | Architecture decisions: query optimization, index strategy, resilience patterns | Technical leads, performance engineering |
| [**BENCHMARK_REPORT.md**](BENCHMARK_REPORT.md) | Performance testing: before/after metrics, optimization impact, recommendations | Technical leads, DevOps |
| [**EXPORT_SWAGGER.md**](docs/EXPORT_SWAGGER.md) | Export OpenAPI spec for Postman/Swagger Editor without running server | All developers, QA, reviewers |
| [**AUTH_QUICK_START.md**](AUTH_QUICK_START.md) | Quick reference: cURL examples, test scenarios | All developers, QA |
| [**UTILITIES_QUICK_REFERENCE.md**](UTILITIES_QUICK_REFERENCE.md) | Code snippets: copy-paste patterns for common tasks | Backend developers |

---

## 📤 Share API Specification with Reviewers

Export the OpenAPI specification as a static JSON file that reviewers can import into Postman, Swagger Editor, or other tools **without running the server**.

### Quick Export

```bash
npm run export:swagger
```

This generates `docs/openapi.json` with the complete API specification. Reviewers can then:

- **Postman**: File → Import → Select `docs/openapi.json`
- **Swagger Editor**: https://editor.swagger.io/ → File → Import File → Select `docs/openapi.json`
- **IntelliJ/VS Code**: Right-click file → Generate REST Client

See [EXPORT_SWAGGER.md](docs/EXPORT_SWAGGER.md) for detailed instructions.

---

## 🧪 Test Credentials

After running `npm run db:setup`, use these accounts:

**Admin Account:**
```
Email: admin@farm.com
Password: admin@123
Role: ADMIN
```

**Sample Vendor (10 total):**
```
Email: vendor1@faker.com
Password: vendor1@123
Role: VENDOR
```

**Sample Customer (25 total):**
```
Email: customer1@faker.com
Password: customer1@123
Role: CUSTOMER
```

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Database
npm run db:setup        # Migrate + seed (one command)
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate:dev       # Create migration + apply
npm run prisma:migrate:prod      # Apply migrations to production
npm run prisma:seed     # Run seed.js

# Production
npm start               # Start production server

# Prisma Studio (visual database explorer)
npm run prisma:studio  # Open UI to browse database
```

---

## 🏗️ Architecture Pattern

```
HTTP Request
    ↓
Route (authRoutes.js)
    ↓
Middleware (validate, authenticate, authorize)
    ↓
Controller (authController.js)
    - Parse request
    - Call service
    - Format response
    ↓
Service (authService.js)
    - Business logic
    - Prisma queries
    - Error handling
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Response Handler (consistent JSON)
    ↓
Global Error Handler (catches all errors)
    ↓
HTTP Response
```

**Principle**: No business logic in routes/controllers. All logic in services. Controllers only parse and delegate.

---

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Use different port
PORT=3001 npm run dev
```

### Database Connection Failed
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
# Verify credentials and host
```

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### JWT Secrets Not Set
```bash
# Generate strong secrets for production
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
```

### Rate Limiting Too Strict
Rate limits are in `src/middleware/rateLimiter.js`. Modify thresholds as needed:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 requests
});
```

---

## 📋 Production Checklist

Before deploying to production:

- [ ] Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Configure `CORS_ORIGIN` to allowed domains
- [ ] Use cloud PostgreSQL with connection pooling (e.g., Neon, AWS RDS)
- [ ] Enable database backups
- [ ] Set up monitoring (error tracking, performance monitoring)
- [ ] Add request logging (Morgan middleware)
- [ ] Test rate limiting under load
- [ ] Verify email verification (optional enhancement)
- [ ] Implement password reset flow (optional enhancement)

---

## 🤝 Contributing

1. Follow the layered architecture (routes → controllers → services)
2. Use the ResponseHandler for all responses
3. Use the global error handler (throw custom errors)
4. Add input validation with express-validator
5. Write JSDoc comments for functions
6. Keep services focused on business logic only

---

## 📜 License

MIT

---

## 💬 Support

For questions or issues:
1. Check relevant documentation in `/docs` folder
2. Review quick reference guides
3. Check middleware/controller/service comments
4. See troubleshooting section above


