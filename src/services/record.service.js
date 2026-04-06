/**
 * Financial Record Service — Business Logic
 *
 * Handles CRUD operations and filtering for financial records.
 */

const Record = require('../models/Record');
const { NotFoundError } = require('../utils/errors');

class RecordService {
  /**
   * Create a new financial record.
   */
  static create(data) {
    return Record.create(data);
  }

  /**
   * List records with filtering, search, and pagination.
   */
  static getAll(filters) {
    return Record.findAll(filters);
  }

  /**
   * Get a single record by ID.
   */
  static getById(id) {
    const record = Record.findById(id);
    if (!record) throw new NotFoundError(`Record with ID ${id} not found`);
    return record;
  }

  /**
   * Update a financial record.
   */
  static update(id, fields) {
    const record = Record.findById(id);
    if (!record) throw new NotFoundError(`Record with ID ${id} not found`);
    return Record.update(id, fields);
  }

  /**
   * Soft-delete a financial record.
   */
  static delete(id) {
    const record = Record.findById(id);
    if (!record) throw new NotFoundError(`Record with ID ${id} not found`);
    Record.softDelete(id);
    return { message: `Record ${id} soft-deleted` };
  }
}

module.exports = RecordService;
