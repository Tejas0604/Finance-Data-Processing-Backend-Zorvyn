/**
 * Dashboard Service — Business Logic
 *
 * Aggregation and analytical queries for the dashboard.
 */

const Record = require('../models/Record');

class DashboardService {
  /**
   * Overall financial summary: total income, expenses, net balance.
   */
  static getSummary() {
    return Record.getSummary();
  }

  /**
   * Category-wise breakdown with totals and counts.
   */
  static getCategorySummary() {
    const raw = Record.getCategorySummary();

    // Group by category for a cleaner response
    const grouped = {};
    for (const row of raw) {
      if (!grouped[row.category]) {
        grouped[row.category] = { category: row.category, income: 0, expense: 0, total: 0, count: 0 };
      }
      grouped[row.category][row.type] = row.total;
      grouped[row.category].count += row.count;
      grouped[row.category].total += row.type === 'income' ? row.total : -row.total;
    }

    return Object.values(grouped).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }

  /**
   * Monthly income vs expense trends.
   */
  static getTrends(months = 12) {
    return Record.getMonthlyTrends(months);
  }

  /**
   * Most recent financial activity.
   */
  static getRecentActivity(limit = 10) {
    return Record.getRecentActivity(limit);
  }
}

module.exports = DashboardService;
