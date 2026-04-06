/**
 * Auth Service — Business Logic
 *
 * Handles user registration and login with password hashing and JWT issuance.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../utils/errors');

const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Register a new user.
   */
  static async register({ username, email, password, role }) {
    // Check for duplicate username / email
    if (User.findByUsername(username)) {
      throw new ConflictError(`Username '${username}' is already taken`);
    }
    if (User.findByEmail(email)) {
      throw new ConflictError(`Email '${email}' is already registered`);
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = User.create({ username, email, password_hash, role });
    const token = AuthService._generateToken(user);

    return { user, token };
  }

  /**
   * Authenticate a user by username/email + password.
   */
  static async login({ username, password }) {
    const user = User.findByUsername(username);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is deactivated');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = AuthService._generateToken(user);

    // Return user without password_hash
    const { password_hash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  /**
   * Issue a JWT for the given user.
   */
  static _generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }
}

module.exports = AuthService;
