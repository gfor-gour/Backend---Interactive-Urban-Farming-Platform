/**
 * Order HTTP handlers
 */

import * as orderService from '../services/orderService.js';
import ResponseHandler from '../utils/responseHandler.js';

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    return ResponseHandler.created(res, { order }, 'Order placed successfully');
  } catch (error) {
    next(error);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const { data, page, limit, total } = await orderService.listOrdersForUser(req.user, req.query);
    return ResponseHandler.paginated(res, data, page, limit, total, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const patchOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.user, req.body.status);
    return ResponseHandler.success(res, { order }, 'Order status updated');
  } catch (error) {
    next(error);
  }
};
