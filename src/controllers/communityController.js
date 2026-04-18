/**
 * Community forum HTTP handlers
 */

import * as communityService from '../services/communityService.js';
import ResponseHandler from '../utils/responseHandler.js';

export const listPosts = async (req, res, next) => {
  try {
    const { data, page, limit, total } = await communityService.listCommunityPosts(req.query);
    return ResponseHandler.paginated(
      res,
      data,
      page,
      limit,
      total,
      'Posts retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req, res, next) => {
  try {
    const result = await communityService.getCommunityPostById(req.params.id);
    return ResponseHandler.success(res, result, 'Post retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const post = await communityService.createCommunityPost(req.user.id, req.body);
    return ResponseHandler.created(res, { post }, 'Post created successfully');
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const post = await communityService.updateCommunityPost(req.params.id, req.user.id, req.body);
    return ResponseHandler.success(res, { post }, 'Post updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const result = await communityService.deleteCommunityPost(req.params.id, req.user);
    return ResponseHandler.success(res, result, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
};
