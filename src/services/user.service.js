/**
 * User Service — Business Logic
 *
 * Handles user management operations (CRUD, role/status changes).
 */

const User = require('../models/User');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');

class UserService {
  /**
   * List all users.
   */
  static getAll() {
    return User.findAll();
  }

  /**
   * Get a single user by ID.
   */
  static getById(id) {
    const user = User.findById(id);
    if (!user) throw new NotFoundError(`User with ID ${id} not found`);
    return user;
  }

  /**
   * Update a user's profile, role, or status.
   * Only admins should call role/status updates (enforced at route level).
   */
  static update(id, fields) {
    const user = User.findById(id);
    if (!user) throw new NotFoundError(`User with ID ${id} not found`);

    // Prevent duplicate username/email if changing them
    if (fields.username && fields.username !== user.username) {
      if (User.findByUsername(fields.username)) {
        throw new ConflictError(`Username '${fields.username}' is already taken`);
      }
    }
    if (fields.email && fields.email !== user.email) {
      if (User.findByEmail(fields.email)) {
        throw new ConflictError(`Email '${fields.email}' is already registered`);
      }
    }

    return User.update(id, fields);
  }

  /**
   * Deactivate a user (set status to inactive).
   */
  static deactivate(id) {
    const user = User.findById(id);
    if (!user) throw new NotFoundError(`User with ID ${id} not found`);
    return User.update(id, { status: 'inactive' });
  }

  /**
   * Permanently delete a user.
   */
  static delete(id) {
    const user = User.findById(id);
    if (!user) throw new NotFoundError(`User with ID ${id} not found`);
    User.delete(id);
    return { message: `User ${id} deleted` };
  }
}

module.exports = UserService;
