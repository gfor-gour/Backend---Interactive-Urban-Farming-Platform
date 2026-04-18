import prisma from '../../lib/prisma.js';
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';

const getBookingForCustomerOrThrow = async (rentalBookingId, customerId) => {
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: rentalBookingId },
    include: { customer: { select: { id: true } } },
  });

  if (!booking) {
    throw new NotFoundError('Rental booking');
  }

  if (booking.customerId !== customerId) {
    throw new AuthorizationError('You do not have access to this booking');
  }

  return booking;
};

export const createPlantTrackingLog = async (customerId, body) => {
  const { rentalBookingId, plantName, healthStatus, notes } = body;

  const booking = await getBookingForCustomerOrThrow(rentalBookingId, customerId);

  if (booking.status === 'CANCELLED') {
    throw new AuthorizationError('Cannot add plant logs to a cancelled booking');
  }

  const log = await prisma.plantTracking.create({
    data: {
      rentalBookingId,
      plantName: plantName.trim(),
      healthStatus,
      notes: notes != null && notes !== '' ? String(notes) : null,
      lastUpdatedAt: new Date(),
    },
  });

  return log;
};

export const getPlantTrackingHistory = async (bookingId, customerId) => {
  await getBookingForCustomerOrThrow(bookingId, customerId);

  const logs = await prisma.plantTracking.findMany({
    where: { rentalBookingId: bookingId },
    orderBy: { lastUpdatedAt: 'desc' },
  });

  return { bookingId, logs };
};


export const updatePlantTrackingEntry = async (plantTrackingId, customerId, body) => {
  const entry = await prisma.plantTracking.findUnique({
    where: { id: plantTrackingId },
    include: {
      rentalBooking: {
        include: { customer: { select: { id: true } } },
      },
    },
  });

  if (!entry) {
    throw new NotFoundError('Plant tracking entry');
  }

  if (entry.rentalBooking.customerId !== customerId) {
    throw new AuthorizationError('You do not have access to this plant log');
  }

  if (entry.rentalBooking.status === 'CANCELLED') {
    throw new AuthorizationError('Cannot update plant logs for a cancelled booking');
  }

  const data = {
    lastUpdatedAt: new Date(),
  };
  if (body.healthStatus !== undefined) data.healthStatus = body.healthStatus;
  if (body.notes !== undefined) {
    data.notes = body.notes === null || body.notes === '' ? null : String(body.notes);
  }

  if (body.healthStatus === undefined && body.notes === undefined) {
    throw new ValidationError('Provide healthStatus and/or notes to update');
  }

  const updated = await prisma.plantTracking.update({
    where: { id: plantTrackingId },
    data,
  });

  return updated;
};
