/**
 * Farm rental spaces & customer bookings
 */

import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const decimalToNumber = (d) => (d == null ? d : Number(d));

const mapSpace = (s) => ({
  ...s,
  pricePerMonth: decimalToNumber(s.pricePerMonth),
});

const getVendorProfileOrThrow = async (userId) => {
  const vp = await prisma.vendorProfile.findUnique({
    where: { userId },
    include: { user: { select: { id: true, status: true } } },
  });
  if (!vp) {
    throw new NotFoundError('Vendor profile');
  }
  if (vp.user.status !== 'ACTIVE') {
    throw new AuthorizationError('Vendor account is not active');
  }
  return vp;
};

const assertVendorOwnsSpace = async (rentalSpaceId, userId) => {
  const space = await prisma.rentalSpace.findUnique({
    where: { id: rentalSpaceId },
    include: { vendor: true },
  });
  if (!space) {
    throw new NotFoundError('Rental space');
  }
  if (space.vendor.userId !== userId) {
    throw new AuthorizationError('You do not own this rental space');
  }
  return space;
};

/**
 * GET /api/rentals — public catalog (available listings)
 */
export const listRentalSpaces = async (query) => {
  const page = Math.min(
    Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1),
    1_000_000
  );
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const where = {
    isAvailable: true,
  };

  if (query.location) {
    const loc = String(query.location).trim();
    if (loc.length > 0) {
      where.location = { contains: loc, mode: 'insensitive' };
    }
  }

  if (query.size) {
    where.size = { equals: String(query.size), mode: 'insensitive' };
  }

  const maxPrice =
    query.maxPrice != null && query.maxPrice !== '' ? Number(query.maxPrice) : null;
  if (maxPrice != null && !Number.isNaN(maxPrice)) {
    where.pricePerMonth = { lte: new Prisma.Decimal(maxPrice) };
  }

  const [rows, total] = await Promise.all([
    prisma.rentalSpace.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            farmName: true,
            farmLocation: true,
            lat: true,
            lng: true,
          },
        },
      },
    }),
    prisma.rentalSpace.count({ where }),
  ]);

  const data = rows.map((r) => {
    const { vendor, ...rest } = r;
    return { ...mapSpace(rest), vendor };
  });

  return { data, page, limit, total };
};

/**
 * GET /api/rentals/:id — public detail
 */
export const getRentalSpaceById = async (id) => {
  const space = await prisma.rentalSpace.findUnique({
    where: { id },
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

  if (!space) {
    throw new NotFoundError('Rental space');
  }

  const { vendor, ...rest } = space;
  return {
    rentalSpace: {
      ...mapSpace(rest),
      vendor: {
        id: vendor.id,
        farmName: vendor.farmName,
        farmLocation: vendor.farmLocation,
        lat: vendor.lat,
        lng: vendor.lng,
        user: vendor.user,
      },
    },
  };
};

/**
 * POST /api/rentals — vendor creates listing
 */
export const createRentalSpace = async (userId, body) => {
  const vp = await getVendorProfileOrThrow(userId);

  const space = await prisma.rentalSpace.create({
    data: {
      vendorId: vp.id,
      location: body.location,
      size: body.size,
      pricePerMonth: new Prisma.Decimal(body.pricePerMonth),
      isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
    },
  });

  return mapSpace(space);
};

/**
 * PUT /api/rentals/:id — vendor updates own space
 */
export const updateRentalSpace = async (rentalSpaceId, userId, body) => {
  await assertVendorOwnsSpace(rentalSpaceId, userId);

  const data = {};
  if (body.location !== undefined) data.location = body.location;
  if (body.size !== undefined) data.size = body.size;
  if (body.pricePerMonth !== undefined) {
    data.pricePerMonth = new Prisma.Decimal(body.pricePerMonth);
  }
  if (body.isAvailable !== undefined) data.isAvailable = Boolean(body.isAvailable);

  if (Object.keys(data).length === 0) {
    throw new ValidationError('At least one field is required to update');
  }

  const updated = await prisma.rentalSpace.update({
    where: { id: rentalSpaceId },
    data,
  });

  return mapSpace(updated);
};

/**
 * POST /api/rentals/:id/book — customer; overlap check + transaction
 */
export const createRentalBooking = async (rentalSpaceId, customerId, body) => {
  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ValidationError('startDate and endDate must be valid dates');
  }
  if (startDate >= endDate) {
    throw new ValidationError('endDate must be after startDate');
  }

  const customer = await prisma.user.findUnique({ where: { id: customerId } });
  if (!customer || customer.role !== 'CUSTOMER') {
    throw new AuthorizationError('Only customers can book rental spaces');
  }
  if (customer.status !== 'ACTIVE') {
    throw new AuthorizationError('Account must be active to book');
  }

  const booking = await prisma.$transaction(async (tx) => {
    const space = await tx.rentalSpace.findUnique({
      where: { id: rentalSpaceId },
      include: {
        vendor: { include: { user: { select: { id: true, status: true } } } },
      },
    });

    if (!space) {
      throw new NotFoundError('Rental space');
    }

    if (!space.isAvailable) {
      throw new ConflictError(
        'This rental space is not currently available for booking. The vendor may reopen it later.'
      );
    }

    if (space.vendor.user.status !== 'ACTIVE') {
      throw new ConflictError('This vendor is not accepting bookings right now.');
    }

    if (space.vendor.userId === customerId) {
      throw new AuthorizationError('You cannot book your own rental space');
    }

    const overlapping = await tx.rentalBooking.findFirst({
      where: {
        rentalSpaceId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });

    if (overlapping) {
      throw new ConflictError(
        'This space is already booked for overlapping dates. Please choose different dates.'
      );
    }

    const created = await tx.rentalBooking.create({
      data: {
        customerId,
        rentalSpaceId,
        startDate,
        endDate,
        status: 'CONFIRMED',
      },
      include: {
        rentalSpace: {
          select: {
            id: true,
            location: true,
            size: true,
            pricePerMonth: true,
          },
        },
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await tx.rentalSpace.update({
      where: { id: rentalSpaceId },
      data: { isAvailable: false },
    });

    return created;
  });

  return {
    ...booking,
    rentalSpace: booking.rentalSpace
      ? {
          ...booking.rentalSpace,
          pricePerMonth: decimalToNumber(booking.rentalSpace.pricePerMonth),
        }
      : booking.rentalSpace,
  };
};

/**
 * GET /api/rentals/bookings — customer's own bookings, paginated
 */
export const listMyRentalBookings = async (customerId, query) => {
  const page = Math.min(
    Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1),
    1_000_000
  );
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const where = { customerId };

  const [rows, total] = await Promise.all([
    prisma.rentalBooking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: 'desc' },
      include: {
        rentalSpace: {
          include: {
            vendor: {
              select: {
                id: true,
                farmName: true,
                farmLocation: true,
              },
            },
          },
        },
      },
    }),
    prisma.rentalBooking.count({ where }),
  ]);

  const data = rows.map((b) => ({
    ...b,
    rentalSpace: b.rentalSpace
      ? {
          ...b.rentalSpace,
          pricePerMonth: decimalToNumber(b.rentalSpace.pricePerMonth),
        }
      : b.rentalSpace,
  }));

  return { data, page, limit, total };
};
