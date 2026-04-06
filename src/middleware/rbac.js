/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Factory function that returns middleware restricting access to the
 * specified list of allowed roles.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, authorize('admin'), handler);
 *   router.get('/analysts',   authenticate, authorize('admin', 'analyst'), handler);
 */

const { ForbiddenError } = require('../utils/errors');

function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.user.role}' is not allowed to perform this action. ` +
          `Required: ${allowedRoles.join(' or ')}.`
        )
      );
    }

    next();
  };
}

module.exports = authorize;
