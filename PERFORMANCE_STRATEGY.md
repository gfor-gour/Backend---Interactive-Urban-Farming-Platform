# API Response Control and Performance Strategy

## Urban Farming REST API — Performance Architecture

### Response Consistency & Control

The application implements a standardized JSON response envelope across all endpoints through a centralized `ResponseHandler` utility. Every response follows the pattern:

```json
{
  "success": boolean,
  "message": "Human-readable description",
  "data": { /* resource or array */ },
  "meta": { /* pagination info if applicable */ }
}
```

This consistency enables:
- **Client-side predictability**: Frontend code handles a single response shape across all endpoints
- **Middleware composability**: Error handler, rate limiter, and authentication all return identical formats
- **Monitoring clarity**: Logging and observability tools parse responses uniformly
- **Reduced payload variance**: No surprises in response structure affecting response times or parsing

### Pagination Strategy

Rather than serving unbounded result sets, the API implements cursor-free pagination with standard `page` and `limit` query parameters. Default limit is 10 items; maximum configurable to 100. The response `meta` object includes:

```json
{
  "page": 1,
  "limit": 10,
  "total": 245,
  "pages": 25,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**Performance benefit**: Limiting result sets to 10–100 items reduces serialization time, network bandwidth, and client-side processing load. For a list endpoint returning 245 records, pagination reduces per-request data transfer by 90–95%.

### Prisma Query Optimization

Three patterns prevent the common N+1 query problem and unnecessary data transfer:

1. **Field Selection (`select`)**: Controllers explicitly request only required fields
   ```javascript
   const produce = await prisma.produce.findMany({
     select: { id: true, name: true, price: true, vendorId: true }
   });
   ```
   This reduces database I/O and serialization time compared to fetching entire documents.

2. **Relationship Loading (`include` vs separate queries)**: For deeply nested relationships, `include` is preferred over multiple queries when relationships are small. For large relationships, separate paginated queries are executed.
   ```javascript
   const vendor = await prisma.vendor.findUnique({
     where: { id },
     include: { farms: { take: 5 } } // Limited include
   });
   ```

3. **Avoiding N+1 Queries**: List endpoints fetch parent records once, then use `select` to pull related IDs. Child resources are fetched in the same query or in a single follow-up query with `WHERE IN`.
   ```javascript
   const produce = await prisma.produce.findMany({
     include: { vendor: { select: { id: true, name: true } } }
   });
   ```

### Index Strategy

PostgreSQL indexes are applied to high-cardinality, frequently queried columns:

- **Email** (`User.email`): Unique index for auth lookups and duplicate prevention
- **VendorId** (foreign keys on Produce, Rental, etc.): Enables fast vendor-scoped queries
- **UserId** (foreign keys across models): Supports customer-scoped list operations
- **CreatedAt**: Optional composite index for time-range queries (e.g., "produce added this month")

**Schema example** (indexes managed via Prisma migrations):
```prisma
model User {
  id    String @id @default(uuid())
  email String @unique  // ← Indexed
  name  String
}

model Produce {
  id       String   @id @default(uuid())
  vendorId String   // ← Indexed for vendor.produce lookups
  vendor   User @relation(fields: [vendorId], references: [id])
  
  @@index([vendorId])  // Explicit index
}
```

### Rate Limiting Implementation

Express-rate-limit middleware enforces per-route request budgets:

- **Auth routes** (`/api/auth/*`): 10 requests / 15 minutes (global)
- **Login attempts** (`POST /api/auth/login`): 5 attempts / 15 minutes per email
- **Registration** (`POST /api/auth/register`): 3 accounts / 1 hour per IP
- **General routes** (`/api/*`): 100 requests / 1 minute (token bucket)
- **Sensitive operations**: 5 requests / 1 hour

Rate limits prevent:
- Brute-force authentication attacks
- Credential stuffing
- Resource exhaustion from accidental runaway clients
- DDoS amplification

In-memory store suitable for development; Redis recommended for distributed deployments.

### Error Handling Architecture

A centralized error middleware acts as a system boundary, preventing cascading failures:

```javascript
// Global error handler registered last in middleware chain
app.use(globalErrorHandler);
```

This boundary:
- **Catches uncaught exceptions** from all async routes
- **Normalizes database errors**: Prisma error codes (P2002, P2025, etc.) → standard HTTP status codes
- **Normalizes authentication errors**: JWT validation failures → 401 consistent format
- **Prevents server crashes**: Unhandled Promise rejections gracefully respond instead of crashing
- **Hides sensitive data**: Stack traces excluded in production; error messages are safe for clients

**Performance impact**: Without this boundary, a single database error crashes the server and drops all in-flight requests. With it, other requests complete normally while the failing request returns a proper error response.

---

## Summary

The strategy prioritizes **predictability and resilience**. Standardized responses (ResponseHandler) simplify client code and reduce serialization variance, pagination limits resource consumption per request, Prisma optimizations reduce database load, indexes speed critical lookups, rate limiting prevents resource exhaustion, and error boundaries prevent cascading failures. Together, these architectural decisions reduce latency variance and improve system reliability under load. The system maintains consistent performance characteristics even when components fail gracefully.
