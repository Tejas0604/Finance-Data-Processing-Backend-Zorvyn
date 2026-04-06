/**
 * Financial Record Routes
 *
 * CRUD endpoints for financial records with role-based access:
 * - Viewer/Analyst/Admin can READ
 * - Only Admin can CREATE, UPDATE, DELETE
 */

const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const RecordService = require('../services/record.service');
const { ROLES, RECORD_TYPES, CATEGORIES, PAGINATION } = require('../utils/constants');

const router = express.Router();

// All record routes require authentication
router.use(authenticate);

// ─── Validation Schemas ─────────────────────────────────────

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid(...Object.values(RECORD_TYPES)).required(),
  category: Joi.string().valid(...CATEGORIES).required(),
  date: Joi.date().iso().required(),
  description: Joi.string().max(500).allow('').default(''),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid(...Object.values(RECORD_TYPES)),
  category: Joi.string().valid(...CATEGORIES),
  date: Joi.date().iso(),
  description: Joi.string().max(500).allow(''),
}).min(1);

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  type: Joi.string().valid(...Object.values(RECORD_TYPES)),
  category: Joi.string().valid(...CATEGORIES),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  search: Joi.string().max(100),
});

// ─── Routes ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/records:
 *   get:
 *     tags: [Financial Records]
 *     summary: List financial records with filtering & pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of records
 */
router.get('/', validate(listQuerySchema, 'query'), (req, res, next) => {
  try {
    const filters = { ...req.query };
    
    // Ensure dates are strings for SQLite comparison
    if (filters.startDate instanceof Date) {
      filters.startDate = filters.startDate.toISOString().split('T')[0];
    }
    if (filters.endDate instanceof Date) {
      filters.endDate = filters.endDate.toISOString().split('T')[0];
    }

    const result = RecordService.getAll(filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     tags: [Financial Records]
 *     summary: Get a single financial record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Record data
 *       404:
 *         description: Record not found
 */
router.get('/:id', (req, res, next) => {
  try {
    const record = RecordService.getById(parseInt(req.params.id, 10));
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/records:
 *   post:
 *     tags: [Financial Records]
 *     summary: Create a new financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *                 example: salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               description:
 *                 type: string
 *                 example: "January salary"
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate(createRecordSchema),
  (req, res, next) => {
    try {
      const record = RecordService.create({
        ...req.body,
        user_id: req.user.id,
        date: req.body.date instanceof Date
          ? req.body.date.toISOString().split('T')[0]
          : req.body.date,
      });
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     tags: [Financial Records]
 *     summary: Update a financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string }
 *               date: { type: string, format: date }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated record
 *       404:
 *         description: Record not found
 */
router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  validate(updateRecordSchema),
  (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const data = { ...req.body };
      if (data.date instanceof Date) {
        data.date = data.date.toISOString().split('T')[0];
      }
      const record = RecordService.update(id, data);
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     tags: [Financial Records]
 *     summary: Soft-delete a financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Record soft-deleted
 *       404:
 *         description: Record not found
 */
router.delete('/:id', authorize(ROLES.ADMIN), (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = RecordService.delete(id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
