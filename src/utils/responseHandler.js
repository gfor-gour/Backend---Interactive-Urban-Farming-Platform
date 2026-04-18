
class ResponseHandler {

  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }


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

  static noContent(res) {
    return res.status(204).send();
  }


  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }


  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static conflict(res, message = 'Resource conflict') {
    return this.error(res, message, 409);
  }

  static validationError(res, message = 'Validation failed', errors = null) {
    return this.error(res, message, 422, errors);
  }


  static serverError(res, message = 'Internal server error') {
    return this.error(res, message, 500);
  }
}

export default ResponseHandler;
