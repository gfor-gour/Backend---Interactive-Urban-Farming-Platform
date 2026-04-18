# Prisma ORM Setup 

## Configuration

Prisma is configured with PostgreSQL as the datasource. The connection string is read from `DATABASE_URL` in your `.env` file.

### Initial Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   npm install -D prisma @prisma/client
   ```

2. **Verify DATABASE_URL** in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/urban_farming_db
   ```

3. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

## Connection Management

### Prisma Client Singleton Pattern

The `lib/prisma.js` file implements a singleton pattern for Prisma Client:

```javascript
import prisma from './lib/prisma.js';

// Use throughout your app
const users = await prisma.user.findMany();
```

**Why this matters:**
- Avoids connection pool exhaustion in development with hot reloading
- Reuses a single connection instance for the entire application
- Gracefully disconnects on process termination (SIGINT, SIGTERM)
- Logs queries in development mode for debugging

### Connection Pooling Best Practices

PostgreSQL connection string format:
```
postgresql://user:password@host:port/database
```

**For Production:**
- Use connection pooling with PgBouncer or similar
- Recommended: https://www.neon.tech/ or AWS RDS PostgreSQL
- Set `DATABASE_URL` with built-in connection pooling

**Example with connection pool:**
```
postgresql://user:password@pooler.example.com:6432/database?schema=public
```

## Database Migrations

### Create/Update Schema

1. **Modify schema** in `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npm run prisma:migrate:dev -- --name add_users_table
   ```
   Creates: `prisma/migrations/TIMESTAMP_add_users_table/migration.sql`

3. **Apply migration to production**:
   ```bash
   npm run prisma:migrate:prod
   ```

### Schema Example

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Farm {
  id    Int     @id @default(autoincrement())
  name  String
  location String
  area  Float
  userId Int
  user  User @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Seeding Database

### Create Seed Data

Edit `prisma/seed.js` to add test/reference data:

```javascript
async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
    },
  });
  console.log('Created user:', user);
}
```

### Run Seeder

```bash
npm run prisma:seed
```

### Full Database Setup

One command to migrate + seed:
```bash
npm run db:setup
```

## Testing Database Connection

The health check endpoint (`GET /health`) now includes database status:

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

Test on startup:
```bash
npm run dev
# Watch logs for: ✅ Database connection established
```

## Common Tasks

### Query Examples in Services

```javascript
// In src/services/userService.js
import prisma from '../../lib/prisma.js';

export const userService = {
  async getAllUsers() {
    return await prisma.user.findMany();
  },

  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
  },

  async createUser(data) {
    return await prisma.user.create({ data });
  },

  async updateUser(id, data) {
    return await prisma.user.update({
      where: { id: parseInt(id) },
      data,
    });
  },

  async deleteUser(id) {
    return await prisma.user.delete({
      where: { id: parseInt(id) },
    });
  },
};
```

### Raw Queries (when needed)

```javascript
const result = await prisma.$queryRaw`
  SELECT COUNT(*) as total FROM "User"
`;
```

### Transactions

```javascript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: 'test@example.com' } });
  const farm = await tx.farm.create({
    data: {
      name: 'My Farm',
      userId: user.id,
    },
  });
  return { user, farm };
});
```

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/urban_farming_db
NODE_ENV=development
PORT=3000
```

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Check host/port in DATABASE_URL
- Verify credentials

### Prisma Client Not Generated
```
npm run prisma:generate
```

### Migration Conflicts
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or push schema to database
npx prisma db push
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [Database Pooling Guide](https://www.prisma.io/docs/guides/database/pooling)
