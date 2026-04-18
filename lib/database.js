/**
 * Prisma Database Utilities
 * Common helper functions for database operations
 */

import prisma from './prisma.js';

/**
 * Test database connection
 * Throws error if connection fails
 */
export async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true, message: 'Database connection OK' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Get database stats
 */
export async function getDatabaseStats() {
  try {
    const stats = {};

    // Get table row counts
    const result = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = schemaname AND table_name = tablename) as column_count
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    return {
      success: true,
      tables: result,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Execute raw SQL query safely
 * Use only with trusted queries - NEVER with user input
 */
export async function executeRawQuery(sql) {
  try {
    const result = await prisma.$queryRawUnsafe(sql);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Batch create records with transaction
 * Ensures all-or-nothing operation
 */
export async function batchCreate(model, records) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      return await Promise.all(
        records.map((record) => tx[model].create({ data: record }))
      );
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Paginated query helper
 */
export async function paginate(
  model,
  where = {},
  page = 1,
  limit = 10,
  orderBy = {}
) {
  const skip = (page - 1) * limit;

  try {
    const [data, total] = await prisma.$transaction([
      prisma[model].findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma[model].count({ where }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Soft delete helper (if using deletedAt field)
 * Mark record as deleted without removing from database
 */
export async function softDelete(model, id) {
  try {
    const result = await prisma[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Restore soft-deleted record
 */
export async function restore(model, id) {
  try {
    const result = await prisma[model].update({
      where: { id },
      data: { deletedAt: null },
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export default {
  testDatabaseConnection,
  getDatabaseStats,
  executeRawQuery,
  batchCreate,
  paginate,
  softDelete,
  restore,
};
