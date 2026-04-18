/**
 * Plant tracking HTTP handlers
 */

import * as plantTrackingService from '../services/plantTrackingService.js';
import ResponseHandler from '../utils/responseHandler.js';

export const createLog = async (req, res, next) => {
  try {
    const log = await plantTrackingService.createPlantTrackingLog(req.user.id, req.body);
    return ResponseHandler.created(res, { log }, 'Plant update logged successfully');
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const result = await plantTrackingService.getPlantTrackingHistory(
      req.params.bookingId,
      req.user.id
    );
    return ResponseHandler.success(res, result, 'Plant tracking history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const patchEntry = async (req, res, next) => {
  try {
    const log = await plantTrackingService.updatePlantTrackingEntry(
      req.params.id,
      req.user.id,
      req.body
    );
    return ResponseHandler.success(res, { log }, 'Plant log updated successfully');
  } catch (error) {
    next(error);
  }
};
