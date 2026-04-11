/**
 * ApiError — a structured error with HTTP status code.
 * Throw this anywhere in service/controller code;
 * the global error middleware will format it into a JSON response.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 404, 500, …)
   * @param {string} message    - Human-readable error message
   * @param {any}    [details]  - Optional extra info (validation errors, etc.)
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details    = details;
    this.isOperational = true; // distinguish from unexpected programmer errors
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, details)  { return new ApiError(400, msg, details); }
  static notFound(msg)             { return new ApiError(404, msg || 'Not found'); }
  static unauthorized(msg)         { return new ApiError(401, msg || 'Unauthorized'); }
  static forbidden(msg)            { return new ApiError(403, msg || 'Forbidden'); }
  static internal(msg)             { return new ApiError(500, msg || 'Internal server error'); }
}

module.exports = ApiError;