/**
 * Prisma Client Singleton
 * Reuses a single Prisma Client instance in development to avoid connection exhaustion.
 * In production, each serverless function gets its own instance.
 * 
 * Best Practice: Avoid creating multiple PrismaClient instances which
 * can exhaust database connection pool, especially in development
 * with hot module reloading.
 */

import { PrismaClient } from '@prisma/client';

const log = ['query', 'error', 'warn'];

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? log : ['error'],
});

// Handle graceful shutdown
const prismaShutdown = async () => {
  await prisma.$disconnect();
};

// Register shutdown handlers
process.on('SIGINT', prismaShutdown);
process.on('SIGTERM', prismaShutdown);

export default prisma;
