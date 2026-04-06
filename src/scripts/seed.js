/**
 * Database Seed Script
 *
 * Populates the database with sample users and financial records for
 * testing and demonstration purposes.
 *
 * Usage: npm run seed
 */

require('dotenv').config();

const bcrypt = require('bcrypt');
const { getDatabase, closeDatabase } = require('../config/database');

const SALT_ROUNDS = 10;

async function seed() {
  console.log('🌱 Seeding database...\n');

  const db = getDatabase();

  // ─── Clear existing data ──────────────────────────────────

  db.exec('DELETE FROM financial_records');
  db.exec('DELETE FROM users');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'financial_records')");

  // ─── Users ────────────────────────────────────────────────

  const users = [
    { username: 'admin', email: 'admin@finance.app', password: 'admin123', role: 'admin' },
    { username: 'analyst', email: 'analyst@finance.app', password: 'analyst123', role: 'analyst' },
    { username: 'viewer', email: 'viewer@finance.app', password: 'viewer123', role: 'viewer' },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)
  `);

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    insertUser.run(u.username, u.email, hash, u.role);
    console.log(`  ✅ User: ${u.username} (${u.role}) — password: ${u.password}`);
  }

  // ─── Financial Records ────────────────────────────────────

  const records = [
    // Income
    { user_id: 1, amount: 8500.00, type: 'income',  category: 'salary',       date: '2024-01-05', description: 'January salary' },
    { user_id: 1, amount: 8500.00, type: 'income',  category: 'salary',       date: '2024-02-05', description: 'February salary' },
    { user_id: 1, amount: 8500.00, type: 'income',  category: 'salary',       date: '2024-03-05', description: 'March salary' },
    { user_id: 1, amount: 2000.00, type: 'income',  category: 'freelance',    date: '2024-01-15', description: 'Logo design project' },
    { user_id: 1, amount: 3500.00, type: 'income',  category: 'freelance',    date: '2024-02-20', description: 'Website development' },
    { user_id: 1, amount: 1200.00, type: 'income',  category: 'investments',  date: '2024-01-28', description: 'Dividend payout' },
    { user_id: 1, amount: 800.00,  type: 'income',  category: 'investments',  date: '2024-03-15', description: 'Stock sale profit' },

    // Expenses
    { user_id: 1, amount: 1800.00, type: 'expense', category: 'rent',          date: '2024-01-01', description: 'January rent' },
    { user_id: 1, amount: 1800.00, type: 'expense', category: 'rent',          date: '2024-02-01', description: 'February rent' },
    { user_id: 1, amount: 1800.00, type: 'expense', category: 'rent',          date: '2024-03-01', description: 'March rent' },
    { user_id: 1, amount: 150.00,  type: 'expense', category: 'utilities',     date: '2024-01-10', description: 'Electricity bill' },
    { user_id: 1, amount: 85.00,   type: 'expense', category: 'utilities',     date: '2024-01-12', description: 'Internet service' },
    { user_id: 1, amount: 420.00,  type: 'expense', category: 'groceries',     date: '2024-01-08', description: 'Weekly groceries' },
    { user_id: 1, amount: 380.00,  type: 'expense', category: 'groceries',     date: '2024-02-08', description: 'Weekly groceries' },
    { user_id: 1, amount: 65.00,   type: 'expense', category: 'transportation', date: '2024-01-03', description: 'Gas refill' },
    { user_id: 1, amount: 120.00,  type: 'expense', category: 'entertainment', date: '2024-01-20', description: 'Concert tickets' },
    { user_id: 1, amount: 250.00,  type: 'expense', category: 'healthcare',    date: '2024-02-14', description: 'Dental checkup' },
    { user_id: 1, amount: 45.00,   type: 'expense', category: 'subscriptions', date: '2024-01-01', description: 'Streaming services' },
    { user_id: 1, amount: 350.00,  type: 'expense', category: 'shopping',      date: '2024-02-10', description: 'New running shoes' },
    { user_id: 1, amount: 1500.00, type: 'expense', category: 'travel',        date: '2024-03-10', description: 'Weekend getaway' },
    { user_id: 1, amount: 200.00,  type: 'expense', category: 'education',     date: '2024-01-25', description: 'Online course' },
    { user_id: 1, amount: 100.00,  type: 'expense', category: 'donations',     date: '2024-02-28', description: 'Charity donation' },
    { user_id: 1, amount: 500.00,  type: 'expense', category: 'insurance',     date: '2024-01-15', description: 'Health insurance' },
    { user_id: 1, amount: 2000.00, type: 'expense', category: 'taxes',         date: '2024-03-20', description: 'Quarterly tax payment' },
  ];

  const insertRecord = db.prepare(`
    INSERT INTO financial_records (user_id, amount, type, category, date, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      insertRecord.run(r.user_id, r.amount, r.type, r.category, r.date, r.description);
    }
  });

  insertMany(records);
  console.log(`\n  ✅ ${records.length} financial records created\n`);

  closeDatabase();
  console.log('🌱 Seeding complete!\n');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
