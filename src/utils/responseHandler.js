/**
 * Response Handler Utility
 * Ensures consistent JSON response format across all API endpoints
 * Format: { success, message, data, meta? }
 */

class ResponseHandler {
  /**
   * Send a success response
   * @param {Object} res - Express response object
   * @param {any} data - Response data payload
   * @param {string} message - Success message (optional)
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send a created response (201)
   * @param {Object} res - Express response object
   * @param {any} data - Created resource data
   * @param {string} message - Success message (optional)
   */
  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 400)
   * @param {any} errors - Validation errors (optional)
   */
  static error(res, message = 'An error occurred', statusCode = 400, errors = null) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated success response
   * @param {Object} res - Express response object
   * @param {any[]} data - Array of items
   * @param {number} page - Current page number (1-indexed)
   * @param {number} limit - Items per page
   * @param {number} total - Total items in database
   * @param {string} message - Success message (optional)
   */
  static paginated(
    res,
    data = [],
    page = 1,
    limit = 10,
    total = 0,
    message = 'Data retrieved successfully'
  ) {
    const totalPages = Math.ceil(total / limit);
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return res.status(200).json({
      success: true,
      message,
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        pages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  }

  /**
   * Send a no-content response (204)
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send an unauthorized error (401)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  /**
   * Send a forbidden error (403)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  /**
   * Send a not found error (404)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Send a conflict error (409)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static conflict(res, message = 'Resource conflict') {
    return this.error(res, message, 409);
  }

  /**
   * Send a validation error (422)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {any[]} errors - Validation errors
   */
  static validationError(res, message = 'Validation failed', errors = null) {
    return this.error(res, message, 422, errors);
  }

  /**
   * Send a server error (500)
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  static serverError(res, message = 'Internal server error') {
    return this.error(res, message, 500);
  }
}

export default ResponseHandler;
