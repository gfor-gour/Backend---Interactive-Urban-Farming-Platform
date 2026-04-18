
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

const mapOrder = (o) => ({
  ...o,
  totalPrice: decimalToNumber(o.totalPrice),
  produce: o.produce
    ? {
        ...o.produce,
        price: decimalToNumber(o.produce.price),
      }
    : o.produce,
});


export const createOrder = async (customerId, body) => {
  const { produceId, quantity } = body;

  const customer = await prisma.user.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new NotFoundError('User');
  }
  if (customer.status !== 'ACTIVE') {
    throw new AuthorizationError('Account must be active to order');
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError('quantity must be a positive integer');
  }

  const order = await prisma.$transaction(async (tx) => {
    const produce = await tx.produce.findFirst({
      where: { id: produceId, isActive: true },
      include: {
        vendor: { include: { user: { select: { id: true, status: true } } } },
      },
    });

    if (!produce) {
      throw new NotFoundError('Produce');
    }

    if (produce.vendor.user.status !== 'ACTIVE') {
      throw new ConflictError('This vendor is not accepting orders');
    }

    if (produce.vendor.userId === customerId) {
      throw new AuthorizationError('Cannot order your own produce');
    }

    const totalPrice = new Prisma.Decimal(produce.price).mul(quantity);

    const stock = await tx.produce.updateMany({
      where: {
        id: produceId,
        isActive: true,
        availableQuantity: { gte: quantity },
      },
      data: {
        availableQuantity: { decrement: quantity },
      },
    });

    if (stock.count !== 1) {
      throw new ConflictError('Insufficient stock for the requested quantity');
    }

    return tx.order.create({
      data: {
        customerId,
        produceId,
        quantity,
        totalPrice,
        status: 'PENDING',
      },
      include: {
        produce: {
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
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  });

  return mapOrder(order);
};


export const listOrdersForUser = async (user, query) => {
  const page = Math.min(
    Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1),
    1_000_000
  );
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  let where = {};

  if (user.role === 'CUSTOMER') {
    where = { customerId: user.id };
  } else if (user.role === 'VENDOR') {
    const vp = await prisma.vendorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!vp) {
      return { data: [], page, limit, total: 0 };
    }
    where = { produce: { vendorId: vp.id } };
  } else {
    where = {};
  }

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        produce: {
          include: {
            vendor: {
              select: {
                id: true,
                farmName: true,
                farmLocation: true,
                userId: true,
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const data = rows.map(mapOrder);

  return { data, page, limit, total };
};

export const updateOrderStatus = async (orderId, user, status) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      produce: {
        include: {
          vendor: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Order');
  }

  if (user.role === 'ADMIN') {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        produce: { include: { vendor: { select: { id: true, farmName: true } } } },
      },
    });
    return mapOrder(updated);
  }

  if (user.role !== 'VENDOR') {
    throw new AuthorizationError('Access denied');
  }

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  });
  if (!vendorProfile || vendorProfile.id !== order.produce.vendorId) {
    throw new AuthorizationError('You can only update orders for your own produce');
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      produce: { include: { vendor: { select: { id: true, farmName: true } } } },
    },
  });

  return mapOrder(updated);
};
