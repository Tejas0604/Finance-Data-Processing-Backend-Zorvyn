/**
 * Server Entry Point
 *
 * Starts the Express HTTP server.
 */

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────┐
  │   Finance Dashboard API                  │
  │   Running on http://localhost:${PORT}        │
  │   API Docs: http://localhost:${PORT}/api-docs│
  │   Environment: ${process.env.NODE_ENV || 'development'}             │
  └──────────────────────────────────────────┘
  `);
});
