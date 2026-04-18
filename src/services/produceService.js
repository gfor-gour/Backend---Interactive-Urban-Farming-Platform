/**
 * Produce marketplace — listing, CRUD, soft delete
 */

import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import {
  AuthorizationError,
  NotFoundError,
} from '../utils/errors.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const decimalToNumber = (d) => (d == null ? d : Number(d));

const mapProduceRow = (p) => ({
  ...p,
  price: decimalToNumber(p.price),
});

/**
 * Vendor must have approved certification to create produce
 */
const getVendorProfileForProduceOrThrow = async (userId) => {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId },
    include: { user: { select: { id: true, status: true } } },
  });
  if (!profile) {
    throw new NotFoundError('Vendor profile');
  }
  if (profile.certificationStatus !== 'APPROVED') {
    throw new AuthorizationError(
      'Vendor certification must be approved before listing produce'
    );
  }
  if (profile.user.status !== 'ACTIVE') {
    throw new AuthorizationError('Vendor account is not active');
  }
  return profile;
};

/**
 * GET /api/produce — public catalog
 */
export const listProduce = async (query) => {
  const page = Math.min(
    Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1),
    1_000_000
  );
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const sortByRaw = (query.sortBy || 'createdAt').toString();
  const orderRaw = (query.order || 'desc').toString().toLowerCase();
  const sortField =
    sortByRaw === 'price' ? 'price' : sortByRaw === 'name' ? 'name' : 'createdAt';
  const sortDir = orderRaw === 'asc' ? 'asc' : 'desc';

  const where = {
    isActive: true,
  };

  if (query.category) {
    where.category = { equals: String(query.category), mode: 'insensitive' };
  }

  if (query.vendorId) {
    where.vendorId = String(query.vendorId);
  }

  const minPrice = query.minPrice != null && query.minPrice !== '' ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice != null && query.maxPrice !== '' ? Number(query.maxPrice) : null;
  if (minPrice != null || maxPrice != null) {
    where.price = {};
    if (minPrice != null && !Number.isNaN(minPrice)) {
      where.price.gte = new Prisma.Decimal(minPrice);
    }
    if (maxPrice != null && !Number.isNaN(maxPrice)) {
      where.price.lte = new Prisma.Decimal(maxPrice);
    }
  }

  if (query.location) {
    const loc = String(query.location).trim();
    if (loc.length > 0) {
      where.vendor = {
        ...where.vendor,
        farmLocation: { contains: loc, mode: 'insensitive' },
      };
    }
  }

  const [rows, total] = await Promise.all([
    prisma.produce.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: sortDir },
      include: {
        vendor: {
          select: {
            id: true,
            farmName: true,
            farmLocation: true,
            lat: true,
            lng: true,
            certificationStatus: true,
          },
        },
      },
    }),
    prisma.produce.count({ where }),
  ]);

  const data = rows.map((p) => {
    const { vendor, ...rest } = p;
    return {
      ...mapProduceRow(rest),
      vendor,
    };
  });

  return { data, page, limit, total };
};

/**
 * GET /api/produce/:id — single item with vendor info
 */
export const getProduceById = async (produceId) => {
  const produce = await prisma.produce.findFirst({
    where: { id: produceId, isActive: true },
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!produce) {
    throw new NotFoundError('Produce');
  }

  const { vendor, ...rest } = produce;
  return {
    produce: {
      ...mapProduceRow(rest),
      vendor: {
        id: vendor.id,
        farmName: vendor.farmName,
        farmLocation: vendor.farmLocation,
        lat: vendor.lat,
        lng: vendor.lng,
        certificationStatus: vendor.certificationStatus,
        user: vendor.user,
      },
    },
  };
};

const assertVendorOwnsProduce = async (produceId, userId) => {
  const produce = await prisma.produce.findUnique({
    where: { id: produceId },
    include: { vendor: true },
  });
  if (!produce) {
    throw new NotFoundError('Produce');
  }
  if (produce.vendor.userId !== userId) {
    throw new AuthorizationError('You do not own this produce');
  }
  return produce;
};

/**
 * POST /api/produce
 */
export const createProduce = async (userId, body) => {
  const profile = await getVendorProfileForProduceOrThrow(userId);

  const produce = await prisma.produce.create({
    data: {
      vendorId: profile.id,
      name: body.name,
      description: body.description ?? null,
      price: new Prisma.Decimal(body.price),
      category: body.category,
      certificationStatus: body.certificationStatus ?? 'PENDING',
      availableQuantity: body.availableQuantity,
      isActive: true,
    },
  });

  return mapProduceRow(produce);
};

/**
 * PUT /api/produce/:id — vendor, own only
 */
export const updateProduceForVendor = async (produceId, userId, body) => {
  await assertVendorOwnsProduce(produceId, userId);

  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.price !== undefined) data.price = new Prisma.Decimal(body.price);
  if (body.category !== undefined) data.category = body.category;
  if (body.availableQuantity !== undefined) data.availableQuantity = body.availableQuantity;
  if (body.certificationStatus !== undefined) data.certificationStatus = body.certificationStatus;

  const updated = await prisma.produce.update({
    where: { id: produceId },
    data,
  });

  return mapProduceRow(updated);
};

/**
 * DELETE /api/produce/:id — soft delete; vendor (own) or admin
 */
export const softDeleteProduce = async (produceId, user) => {
  const produce = await prisma.produce.findUnique({
    where: { id: produceId },
    include: { vendor: true },
  });

  if (!produce) {
    throw new NotFoundError('Produce');
  }

  if (user.role === 'ADMIN') {
    await prisma.produce.update({
      where: { id: produceId },
      data: { isActive: false },
    });
    return { id: produceId, isActive: false };
  }

  if (user.role !== 'VENDOR') {
    throw new AuthorizationError('Access denied');
  }

  if (produce.vendor.userId !== user.id) {
    throw new AuthorizationError('You do not own this produce');
  }

  await prisma.produce.update({
    where: { id: produceId },
    data: { isActive: false },
  });

  return { id: produceId, isActive: false };
};
