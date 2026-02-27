// database.js - SQLite database setup and schema for Sub4Earn
require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.dirname(process.env.DB_PATH || './data/sub4earn.db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.resolve(process.env.DB_PATH || './data/sub4earn.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    wallet_balance REAL DEFAULT 0,
    kyc_status TEXT DEFAULT 'not_submitted' CHECK(kyc_status IN ('not_submitted','pending','approved','rejected')),
    role       TEXT DEFAULT 'user' CHECK(role IN ('user','admin')),
    email_verified INTEGER DEFAULT 0,
    referral_code  TEXT UNIQUE,
    referred_by    TEXT,
    upi_id     TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    youtube_url  TEXT NOT NULL,
    reward_amount REAL NOT NULL,
    active       INTEGER DEFAULT 1,
    max_limit    INTEGER DEFAULT 0,
    task_type    TEXT DEFAULT 'subscribe' CHECK(task_type IN ('subscribe','daily_bonus')),
    created_by   TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_tasks (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id),
    task_id       TEXT NOT NULL REFERENCES tasks(id),
    status        TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    proof_image_url TEXT,
    reviewed_by   TEXT,
    reviewed_at   TEXT,
    reject_reason TEXT,
    submitted_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, task_id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id),
    amount       REAL NOT NULL,
    type         TEXT NOT NULL CHECK(type IN ('credit','debit')),
    source       TEXT,
    reference_id TEXT,
    note         TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS kyc (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) UNIQUE,
    full_name    TEXT NOT NULL,
    mobile       TEXT NOT NULL,
    email        TEXT NOT NULL,
    upi_id       TEXT NOT NULL,
    id_proof_url TEXT,
    selfie_url   TEXT,
    status       TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    review_note  TEXT,
    submitted_at TEXT DEFAULT (datetime('now')),
    reviewed_at  TEXT,
    reviewed_by  TEXT
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id),
    amount       REAL NOT NULL,
    upi_id       TEXT NOT NULL,
    status       TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    reject_reason TEXT,
    processed_at TEXT,
    processed_by TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id           TEXT PRIMARY KEY,
    referrer_id  TEXT NOT NULL REFERENCES users(id),
    referred_id  TEXT NOT NULL REFERENCES users(id) UNIQUE,
    bonus_credited INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id          TEXT PRIMARY KEY,
    admin_id    TEXT NOT NULL,
    action      TEXT NOT NULL,
    target_type TEXT,
    target_id   TEXT,
    details     TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Default settings
const defaultSettings = [
  ['min_withdrawal', '149'],
  ['referral_bonus', '10'],
  ['daily_bonus_amount', '5'],
  ['task_reward_amount', '1.8'],
  ['payment_upi_id', 'sub4earn@upi'],
  ['kyc_payment_amount', '90'],
];
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
defaultSettings.forEach(([k, v]) => insertSetting.run(k, v));

// ─── Live migrations (idempotent) ─────────────────────────────────────────────
// Add utr_number to kyc if missing
const kycCols = db.prepare('PRAGMA table_info(kyc)').all().map(c => c.name);
if (!kycCols.includes('utr_number')) {
  db.exec('ALTER TABLE kyc ADD COLUMN utr_number TEXT');
}
if (!kycCols.includes('payment_status')) {
  db.exec("ALTER TABLE kyc ADD COLUMN payment_status TEXT DEFAULT 'pending'");
}

// Set all task rewards to 3.8 INR (system requirement)
db.prepare('UPDATE tasks SET reward_amount = 3.8').run();

// Enforce minimum withdrawal = 149
db.prepare("UPDATE settings SET value = '149' WHERE key = 'min_withdrawal'").run();

module.exports = db;
