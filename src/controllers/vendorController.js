import * as vendorService from '../services/vendorService.js';
import ResponseHandler from '../utils/responseHandler.js';

export const createProfile = async (req, res, next) => {
  try {
    const profile = await vendorService.createVendorProfile(req.user.id, req.body);
    return ResponseHandler.created(res, { profile }, 'Vendor profile created successfully');
  } catch (error) {
    next(error);
  }
};

export const getVendorById = async (req, res, next) => {
  try {
    const result = await vendorService.getVendorPublicById(req.params.id);
    return ResponseHandler.success(res, result, 'Vendor retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await vendorService.updateVendorProfileForUser(req.user.id, req.body);
    return ResponseHandler.success(res, { profile }, 'Vendor profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const submitCertification = async (req, res, next) => {
  try {
    const certification = await vendorService.submitSustainabilityCertification(
      req.user.id,
      req.body
    );
    return ResponseHandler.created(
      res,
      { certification },
      'Certification submitted for review'
    );
  } catch (error) {
    next(error);
  }
};
