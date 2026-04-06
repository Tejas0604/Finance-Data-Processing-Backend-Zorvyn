/**
 * JWT Authentication Middleware
 *
 * Extracts and verifies the Bearer token from the Authorization header,
 * then attaches the decoded user payload to `req.user`.
 * Also checks that the user account is still active.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');

function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed authorization header');
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const user = User.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    next(err);
  }
}

module.exports = authenticate;
