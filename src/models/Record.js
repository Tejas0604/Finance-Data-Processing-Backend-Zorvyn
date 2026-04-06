/**
 * Financial Record Model — Data Access Layer
 *
 * Handles CRUD and filtered queries for financial records.
 * Soft-delete is the default — hard-delete is available but not exposed via API.
 */

const { getDatabase } = require('../config/database');

class Record {
  // ───────────────── Queries ─────────────────

  /**
   * List records with optional filtering, search, and pagination.
   * @param {Object} options
   */
  static findAll({
    page = 1,
    limit = 20,
    type,
    category,
    startDate,
    endDate,
    search,
    userId,
  } = {}) {
    const db = getDatabase();
    const conditions = ['r.is_deleted = 0'];
    const params = [];

    if (type) {
      conditions.push('r.type = ?');
      params.push(type);
    }
    if (category) {
      conditions.push('r.category = ?');
      params.push(category);
    }
    if (startDate) {
      conditions.push('r.date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('r.date <= ?');
      params.push(endDate);
    }
    if (search) {
      conditions.push('(r.description LIKE ? OR r.category LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }
    if (userId) {
      conditions.push('r.user_id = ?');
      params.push(userId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    // Total count for pagination metadata
    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM financial_records r ${where}
    `).get(...params);

    const records = db.prepare(`
      SELECT r.*, u.username as created_by
      FROM financial_records r
      LEFT JOIN users u ON r.user_id = u.id
      ${where}
      ORDER BY r.date DESC, r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return {
      records,
      pagination: {
        page,
        limit,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit),
      },
    };
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT r.*, u.username as created_by
      FROM financial_records r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ? AND r.is_deleted = 0
    `).get(id);
  }

  // ───────────────── Mutations ─────────────────

  static create({ user_id, amount, type, category, date, description = '' }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO financial_records (user_id, amount, type, category, date, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(user_id, amount, type, category, date, description);
    return Record.findById(info.lastInsertRowid);
  }

  static update(id, fields) {
    const db = getDatabase();
    const allowed = ['amount', 'type', 'category', 'date', 'description'];
    const sets = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (sets.length === 0) return Record.findById(id);

    sets.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`
      UPDATE financial_records SET ${sets.join(', ')}
      WHERE id = ? AND is_deleted = 0
    `).run(...values);

    return Record.findById(id);
  }

  /**
   * Soft-delete a record.
   */
  static softDelete(id) {
    const db = getDatabase();
    db.prepare(`
      UPDATE financial_records
      SET is_deleted = 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
  }

  /**
   * Restore a soft-deleted record.
   */
  static restore(id) {
    const db = getDatabase();
    db.prepare(`
      UPDATE financial_records
      SET is_deleted = 0, updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
  }

  // ───────────────── Aggregations (Dashboard) ─────────────────

  static getSummary() {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_balance,
        COUNT(*) AS total_records
      FROM financial_records
      WHERE is_deleted = 0
    `).get();
  }

  static getCategorySummary() {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        category,
        type,
        SUM(amount) AS total,
        COUNT(*)    AS count
      FROM financial_records
      WHERE is_deleted = 0
      GROUP BY category, type
      ORDER BY total DESC
    `).all();
  }

  static getMonthlyTrends(months = 12) {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        strftime('%Y-%m', date) AS month,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
        COUNT(*) AS transactions
      FROM financial_records
      WHERE is_deleted = 0
        AND date >= date('now', '-' || ? || ' months')
      GROUP BY month
      ORDER BY month ASC
    `).all(months);
  }

  static getRecentActivity(limit = 10) {
    const db = getDatabase();
    return db.prepare(`
      SELECT r.*, u.username as created_by
      FROM financial_records r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.is_deleted = 0
      ORDER BY r.created_at DESC
      LIMIT ?
    `).all(limit);
  }
}

module.exports = Record;
