/**
 * User Management Routes
 *
 * Admin-only endpoints for managing users, roles, and statuses.
 * Self-view is allowed for any authenticated user.
 */

const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const UserService = require('../services/user.service');
const { ROLES, USER_STATUSES } = require('../utils/constants');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// ─── Validation Schemas ─────────────────────────────────────

const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email(),
  role: Joi.string().valid(...Object.values(ROLES)),
  status: Joi.string().valid(...Object.values(USER_STATUSES)),
}).min(1); // at least one field required

// ─── Routes ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Forbidden
 */
router.get('/', authorize(ROLES.ADMIN), (req, res) => {
  const users = UserService.getAll();
  res.json({ success: true, data: users, total: users.length });
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 */
router.get('/me', (req, res) => {
  res.json({ success: true, data: req.user });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin or self)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Allow self-view or admin
    if (req.user.role !== ROLES.ADMIN && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only view your own profile' },
      });
    }

    const user = UserService.getById(id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role, status, or profile (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, analyst, viewer]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Updated user
 *       404:
 *         description: User not found
 */
router.patch(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(updateUserSchema),
  (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = UserService.update(id, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: User not found
 */
router.delete('/:id', authorize(ROLES.ADMIN), (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = UserService.deactivate(id);
    res.json({ success: true, data: user, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
