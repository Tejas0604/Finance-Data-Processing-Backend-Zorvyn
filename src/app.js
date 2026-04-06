/**
 * Express Application Setup
 *
 * Configures middleware, mounts routes, and attaches error handling.
 * Exported separately from server.js so tests can import the app
 * without starting the HTTP listener.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');
const errorHandler = require('./middleware/errorHandler');

// Initialise database on import
const { getDatabase } = require('./config/database');
getDatabase();

const app = express();

// ─── Global Middleware ──────────────────────────────────────

// Security headers
app.use(helmet());

// CORS
app.use(cors());

// Request logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later' },
  },
});
app.use('/api/', limiter);

// ─── API Documentation ─────────────────────────────────────

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance Dashboard API Docs',
}));

// ─── Routes ─────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to the Finance Dashboard API',
    docs: '/api-docs',
    health: '/api/health'
  });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/records', require('./routes/record.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Endpoint not found' },
  });
});

// ─── Global Error Handler ───────────────────────────────────

app.use(errorHandler);

module.exports = app;
