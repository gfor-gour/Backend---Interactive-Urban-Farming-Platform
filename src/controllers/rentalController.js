/**
 * Rental space & booking HTTP handlers
 */

import * as rentalService from '../services/rentalService.js';
import ResponseHandler from '../utils/responseHandler.js';

export const listSpaces = async (req, res, next) => {
  try {
    const { data, page, limit, total } = await rentalService.listRentalSpaces(req.query);
    return ResponseHandler.paginated(
      res,
      data,
      page,
      limit,
      total,
      'Rental spaces retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getSpaceById = async (req, res, next) => {
  try {
    const result = await rentalService.getRentalSpaceById(req.params.id);
    return ResponseHandler.success(res, result, 'Rental space retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createSpace = async (req, res, next) => {
  try {
    const rentalSpace = await rentalService.createRentalSpace(req.user.id, req.body);
    return ResponseHandler.created(res, { rentalSpace }, 'Rental space created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSpace = async (req, res, next) => {
  try {
    const rentalSpace = await rentalService.updateRentalSpace(req.params.id, req.user.id, req.body);
    return ResponseHandler.success(res, { rentalSpace }, 'Rental space updated successfully');
  } catch (error) {
    next(error);
  }
};

export const bookSpace = async (req, res, next) => {
  try {
    const booking = await rentalService.createRentalBooking(
      req.params.id,
      req.user.id,
      req.body
    );
    return ResponseHandler.created(res, { booking }, 'Booking confirmed successfully');
  } catch (error) {
    next(error);
  }
};

export const listMyBookings = async (req, res, next) => {
  try {
    const { data, page, limit, total } = await rentalService.listMyRentalBookings(
      req.user.id,
      req.query
    );
    return ResponseHandler.paginated(
      res,
      data,
      page,
      limit,
      total,
      'Bookings retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};
