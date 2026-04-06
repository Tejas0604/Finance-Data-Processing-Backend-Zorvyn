/**
 * Test Setup — shared helpers for integration tests
 *
 * Uses an in-memory SQLite database so tests are fully isolated.
 */

const path = require('path');
const fs = require('fs');

// Point to a temporary test database
const TEST_DB_DIR = path.join(__dirname, '..', 'data');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test.db');

// Set env before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_PATH = TEST_DB_PATH;
process.env.RATE_LIMIT_MAX = '1000'; // high limit for tests

// Clean up any previous test DB
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

// Require app AFTER env is set
const app = require('../src/app');
const request = require('supertest');
const { closeDatabase } = require('../src/config/database');

/**
 * Register a user and return { user, token }.
 */
async function registerUser(overrides = {}) {
  const defaults = {
    username: `user${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
    email: `${Date.now()}@test.com`,
    password: 'testpass123',
    role: 'viewer',
  };
  const data = { ...defaults, ...overrides };
  const res = await request(app).post('/api/auth/register').send(data);
  return res.body.data;
}

/**
 * Create an admin user and return { user, token }.
 */
async function createAdmin() {
  return registerUser({
    role: 'admin',
    username: `admin${Date.now()}`,
    email: `admin${Date.now()}@test.com`,
  });
}

/**
 * Clean up after all tests.
 */
function cleanup() {
  closeDatabase();
  if (fs.existsSync(TEST_DB_PATH)) {
    try { fs.unlinkSync(TEST_DB_PATH); } catch {}
  }
  // Clean WAL/SHM files
  for (const ext of ['-wal', '-shm']) {
    const f = TEST_DB_PATH + ext;
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

module.exports = { app, request, registerUser, createAdmin, cleanup };
