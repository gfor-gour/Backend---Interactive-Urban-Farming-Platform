/**
 * Produce HTTP handlers
 */

import * as produceService from '../services/produceService.js';
import ResponseHandler from '../utils/responseHandler.js';

export const listProduce = async (req, res, next) => {
  try {
    const { data, page, limit, total } = await produceService.listProduce(req.query);
    return ResponseHandler.paginated(res, data, page, limit, total, 'Produce retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getProduceById = async (req, res, next) => {
  try {
    const result = await produceService.getProduceById(req.params.id);
    return ResponseHandler.success(res, result, 'Produce retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createProduce = async (req, res, next) => {
  try {
    const produce = await produceService.createProduce(req.user.id, req.body);
    return ResponseHandler.created(res, { produce }, 'Produce created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProduce = async (req, res, next) => {
  try {
    const produce = await produceService.updateProduceForVendor(req.params.id, req.user.id, req.body);
    return ResponseHandler.success(res, { produce }, 'Produce updated successfully');
  } catch (error) {
    next(error);
  }
};

export const removeProduce = async (req, res, next) => {
  try {
    const result = await produceService.softDeleteProduce(req.params.id, req.user);
    return ResponseHandler.success(res, result, 'Produce deactivated successfully');
  } catch (error) {
    next(error);
  }
};
