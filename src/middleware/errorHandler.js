/**
 * Global Error-Handling Middleware
 *
 * Catches all errors thrown or passed via next(err) and returns a
 * consistent JSON error response.
 */

function errorHandler(err, _req, res, _next) {
  // Try to parse structured validation errors
  let details = null;
  if (err.statusCode === 400 && err.message) {
    try {
      details = JSON.parse(err.message);
    } catch {
      // message is a plain string — that's fine
    }
  }

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: {
      message: details ? 'Validation failed' : err.message || 'Internal server error',
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && statusCode === 500 && {
        stack: err.stack,
      }),
    },
  };

  if (statusCode === 500) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
