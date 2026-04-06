/**
 * Dashboard Routes — Summary & Analytics
 *
 * Provides aggregated data for a frontend dashboard.
 * - Recent activity: all authenticated users
 * - Summary / category / trends: Analyst + Admin only
 */

const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const DashboardService = require('../services/dashboard.service');
const { ROLES } = require('../utils/constants');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// ─── Validation Schemas ─────────────────────────────────────

const trendsQuerySchema = Joi.object({
  months: Joi.number().integer().min(1).max(60).default(12),
});

const recentQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

// ─── Routes ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get overall financial summary (Analyst & Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total income, expenses, net balance, record count
 */
router.get(
  '/summary',
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  (req, res, next) => {
    try {
      const summary = DashboardService.getSummary();
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/dashboard/category-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category-wise income/expense breakdown (Analyst & Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of category breakdowns
 */
router.get(
  '/category-summary',
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  (req, res, next) => {
    try {
      const data = DashboardService.getCategorySummary();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly income/expense trends (Analyst & Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 12 }
 *         description: Number of months to look back
 *     responses:
 *       200:
 *         description: Monthly trend data
 */
router.get(
  '/trends',
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  validate(trendsQuerySchema, 'query'),
  (req, res, next) => {
    try {
      const data = DashboardService.getTrends(req.query.months);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent financial activity (all authenticated users)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of recent records
 */
router.get(
  '/recent',
  validate(recentQuerySchema, 'query'),
  (req, res, next) => {
    try {
      const data = DashboardService.getRecentActivity(req.query.limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
