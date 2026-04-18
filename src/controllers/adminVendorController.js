import * as vendorService from '../services/vendorService.js';
import ResponseHandler from '../utils/responseHandler.js';

export const listVendors = async (req, res, next) => {
  try {
    const { data, page, limit, total } = await vendorService.listVendorsForAdmin(req.query);
    return ResponseHandler.paginated(
      res,
      data,
      page,
      limit,
      total,
      'Vendors retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const patchVendorUserStatus = async (req, res, next) => {
  try {
    const user = await vendorService.updateVendorUserStatus(req.params.id, req.body.status);
    return ResponseHandler.success(res, { user }, 'Vendor account status updated');
  } catch (error) {
    next(error);
  }
};

export const patchCertificationStatus = async (req, res, next) => {
  try {
    const certification = await vendorService.updateCertificationStatus(
      req.params.id,
      req.body.status
    );
    return ResponseHandler.success(res, { certification }, 'Certification status updated');
  } catch (error) {
    next(error);
  }
};
