/**
 * Application-wide constants
 *
 * Centralised definitions for roles, statuses, record types, and categories
 * used across models, services, and validation schemas.
 */

const ROLES = Object.freeze({
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
});

const USER_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

const RECORD_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
});

const CATEGORIES = Object.freeze([
  'salary',
  'freelance',
  'investments',
  'rent',
  'utilities',
  'groceries',
  'transportation',
  'entertainment',
  'healthcare',
  'education',
  'shopping',
  'travel',
  'food',
  'insurance',
  'taxes',
  'donations',
  'subscriptions',
  'other',
]);

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

module.exports = {
  ROLES,
  USER_STATUSES,
  RECORD_TYPES,
  CATEGORIES,
  PAGINATION,
};
