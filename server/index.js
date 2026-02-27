// index.js - Sub4Earn Express server entry point

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { startAutoApprovalJob } = require('./jobs/autoApprove');
const db = require('./database');

const app = express();

/* ───────────────────────── CORS ───────────────────────── */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://earn4sub.vercel.app"
  ],
  credentials: true
}));

/* ───────────────────────── Body Parsers ───────────────────────── */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

/* ───────────────────────── Static Uploads ───────────────────────── */
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

/* ───────────────────────── Rate Limit ───────────────────────── */
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' }
}));

/* ───────────────────────── Routes ───────────────────────── */
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/wallet',   require('./routes/wallet'));
app.use('/api/kyc',      require('./routes/kyc'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/profile',  require('./routes/profile'));
app.use('/api/admin',    require('./routes/admin'));

/* ───────────────────────── Health ───────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Sub4Earn API' });
});

app.get("/api/debug/force-admin-reset", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");

    const NEW_PASSWORD = "A9#xL7pQ2!mRt84"; // strong password

    const hash = await bcrypt.hash(NEW_PASSWORD, 12);

    // First confirm admin exists
    const admin = db.prepare(
      "SELECT id, email FROM users WHERE role='admin' LIMIT 1"
    ).get();

    if (!admin) {
      return res.json({ success: false, message: "No admin found" });
    }

    db.prepare(
      "UPDATE users SET password_hash=? WHERE id=?"
    ).run(hash, admin.id);

    res.json({
      success: true,
      updatedAdmin: admin.email
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────── DEBUG: ADMIN CHECK ───────────────────────── */
app.get("/api/debug/admin-check", (req, res) => {
  try {
    const admins = db.prepare(
      "SELECT id, email, role FROM users WHERE role='admin'"
    ).all();

    res.json({ count: admins.length, admins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────── UPDATE ADMIN PASSWORD (ONE TIME) ───────────────────────── */
app.get("/api/debug/update-admin-password", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");

    const ADMIN_EMAIL = "adminneeraj@sub4earn.com";   // ← agar admin email different ho to yahan change karo
    const NEW_PASSWORD = "Z9#kLp42@QrXm81!";    // ← strong new password

    const hash = await bcrypt.hash(NEW_PASSWORD, 12);

    const result = db.prepare(
      "UPDATE users SET password_hash=? WHERE email=?"
    ).run(hash, ADMIN_EMAIL);

    res.json({
      success: true,
      updatedRows: result.changes
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────── DEBUG: Tasks Count ───────────────────────── */
app.get('/api/debug/tasks-count', (req, res) => {
  try {
    const result = db.prepare("SELECT COUNT(*) as count FROM tasks").get();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────── DEBUG: Safe Reseed ───────────────────────── */
app.get('/api/debug/reseed-tasks', async (req, res) => {
  try {
    const seed = require('./seed');

    db.prepare("PRAGMA foreign_keys = OFF").run();

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all().map(t => t.name);

    if (tables.includes('task_submissions')) {
      db.prepare("DELETE FROM task_submissions").run();
    }

    if (tables.includes('transactions')) {
      db.prepare("DELETE FROM transactions").run();
    }

    if (tables.includes('user_tasks')) {
      db.prepare("DELETE FROM user_tasks").run();
    }

    db.prepare("DELETE FROM tasks").run();
    db.prepare("PRAGMA foreign_keys = ON").run();

    await seed();

    const total = db.prepare("SELECT COUNT(*) as count FROM tasks").get();
    res.json({ success: true, total: total.count });

  } catch (err) {
    console.error("Reseed error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────── Error Handler ───────────────────────── */
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 5}MB`
    });
  }

  if (err.message?.includes('Only JPG')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ───────────────────────── Start Server ───────────────────────── */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Sub4Earn API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  startAutoApprovalJob();
});
