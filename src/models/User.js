/**
 * User Model — Data Access Layer
 *
 * Thin wrapper around prepared SQLite statements for user operations.
 * All methods are static and operate against the singleton database.
 */

const { getDatabase } = require('../config/database');

class User {
  // ───────────────── Queries ─────────────────

  static findAll() {
    const db = getDatabase();
    return db.prepare(`
      SELECT id, username, email, role, status, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT id, username, email, role, status, created_at, updated_at
      FROM users WHERE id = ?
    `).get(id);
  }

  static findByIdWithPassword(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static findByUsername(username) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  static findByEmail(email) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  // ───────────────── Mutations ─────────────────

  static create({ username, email, password_hash, role = 'viewer' }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(username, email, password_hash, role);
    return User.findById(info.lastInsertRowid);
  }

  static update(id, fields) {
    const db = getDatabase();
    const allowed = ['username', 'email', 'role', 'status'];
    const sets = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (sets.length === 0) return User.findById(id);

    sets.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return User.findById(id);
  }

  static delete(id) {
    const db = getDatabase();
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  static count() {
    const db = getDatabase();
    return db.prepare('SELECT COUNT(*) as total FROM users').get().total;
  }
}

module.exports = User;
