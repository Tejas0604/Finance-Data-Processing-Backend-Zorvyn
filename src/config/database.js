/**
 * Database configuration and initialisation
 *
 * Uses better-sqlite3 for synchronous, high-performance SQLite access.
 * Creates the schema on first run with WAL mode for better concurrency.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

/**
 * Initialise or return the singleton database connection.
 * @param {string} [dbPath] - Override path (used by tests).
 * @returns {Database} better-sqlite3 instance
 */
function getDatabase(dbPath) {
  if (db) return db;

  const resolvedPath = dbPath || process.env.DB_PATH || './data/finance.db';
  const absolutePath = path.resolve(resolvedPath);

  // Ensure the parent directory exists
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(absolutePath);

  // Performance & safety pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  return db;
}

/**
 * Create tables if they don't already exist.
 */
function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      email       TEXT    NOT NULL UNIQUE,
      password_hash TEXT  NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'viewer'
                          CHECK(role IN ('admin', 'analyst', 'viewer')),
      status      TEXT    NOT NULL DEFAULT 'active'
                          CHECK(status IN ('active', 'inactive')),
      created_at  DATETIME DEFAULT (datetime('now')),
      updated_at  DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      amount      REAL    NOT NULL CHECK(amount > 0),
      type        TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
      category    TEXT    NOT NULL,
      date        DATE    NOT NULL,
      description TEXT    DEFAULT '',
      is_deleted  INTEGER NOT NULL DEFAULT 0,
      created_at  DATETIME DEFAULT (datetime('now')),
      updated_at  DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_records_user_id   ON financial_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_records_type      ON financial_records(type);
    CREATE INDEX IF NOT EXISTS idx_records_category  ON financial_records(category);
    CREATE INDEX IF NOT EXISTS idx_records_date      ON financial_records(date);
    CREATE INDEX IF NOT EXISTS idx_records_deleted   ON financial_records(is_deleted);
  `);
}

/**
 * Close the database connection (used in teardown / tests).
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase };
