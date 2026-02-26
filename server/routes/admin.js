// routes/admin.js - Admin panel routes for Sub4Earn
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate, requireAdmin, auditLog } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ─── GET /api/admin/dashboard - Summary stats ─────────────────────────────────
router.get('/dashboard', (req, res) => {
  try {
    const stats = {
      total_users: db.prepare("SELECT COUNT(*) as c FROM users WHERE role='user'").get().c,
      total_tasks: db.prepare('SELECT COUNT(*) as c FROM tasks').get().c,
      pending_proofs: db.prepare("SELECT COUNT(*) as c FROM user_tasks WHERE status='pending'").get().c,
      pending_kyc: db.prepare("SELECT COUNT(*) as c FROM kyc WHERE status='pending'").get().c,
      pending_withdrawals: db.prepare("SELECT COUNT(*) as c FROM withdrawals WHERE status='pending'").get().c,
      total_payouts: db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM withdrawals WHERE status='approved'").get().s,
      total_wallet_balance: db.prepare("SELECT COALESCE(SUM(wallet_balance),0) as s FROM users WHERE role='user'").get().s,
    };
    const recent_users = db.prepare("SELECT id, email, created_at, kyc_status FROM users WHERE role='user' ORDER BY created_at DESC LIMIT 5").all();
    res.json({ stats, recent_users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ─── TASKS ─────────────────────────────────────────────────────────────────────
router.get('/tasks', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM user_tasks WHERE task_id=t.id AND status='approved') as approved_count,
        (SELECT COUNT(*) FROM user_tasks WHERE task_id=t.id AND status='pending') as pending_count
      FROM tasks t ORDER BY t.created_at DESC
    `).all();
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', (req, res) => {
  try {
    const { title, youtube_url, reward_amount, max_limit = 0, task_type = 'subscribe', active = 1 } = req.body;
    if (!title || !youtube_url || !reward_amount) return res.status(400).json({ error: 'Title, YouTube URL, and reward amount are required' });
    if (isNaN(parseFloat(reward_amount)) || parseFloat(reward_amount) <= 0) return res.status(400).json({ error: 'Invalid reward amount' });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO tasks (id, title, youtube_url, reward_amount, max_limit, task_type, active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title.trim(), youtube_url.trim(), parseFloat(reward_amount), parseInt(max_limit), task_type, active ? 1 : 0, req.user.id);

    auditLog(req.user.id, 'create_task', 'task', id, { title });
    res.status(201).json({ message: 'Task created successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:id', (req, res) => {
  try {
    const { title, youtube_url, reward_amount, max_limit, active } = req.body;
    const task = db.prepare('SELECT id FROM tasks WHERE id=?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.prepare(`
      UPDATE tasks SET title=COALESCE(?,title), youtube_url=COALESCE(?,youtube_url),
      reward_amount=COALESCE(?,reward_amount), max_limit=COALESCE(?,max_limit), active=COALESCE(?,active)
      WHERE id=?
    `).run(title || null, youtube_url || null, reward_amount ? parseFloat(reward_amount) : null, max_limit !== undefined ? parseInt(max_limit) : null, active !== undefined ? (active ? 1 : 0) : null, req.params.id);

    auditLog(req.user.id, 'update_task', 'task', req.params.id, req.body);
    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/tasks/:id', (req, res) => {
  try {
    db.prepare("UPDATE tasks SET active=0 WHERE id=?").run(req.params.id);
    auditLog(req.user.id, 'disable_task', 'task', req.params.id, {});
    res.json({ message: 'Task disabled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disable task' });
  }
});

// ─── PROOF REVIEW ─────────────────────────────────────────────────────────────
router.get('/proofs', (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const proofs = db.prepare(`
      SELECT ut.*, t.title as task_title, t.reward_amount, u.email as user_email
      FROM user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      JOIN users u ON ut.user_id = u.id
      WHERE ut.status = ?
      ORDER BY ut.submitted_at DESC
    `).all(status);
    res.json({ proofs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch proofs' });
  }
});

router.post('/proofs/:id/approve', (req, res) => {
  try {
    const proof = db.prepare('SELECT * FROM user_tasks WHERE id=?').get(req.params.id);
    if (!proof) return res.status(404).json({ error: 'Proof not found' });
    if (proof.status !== 'pending') return res.status(400).json({ error: 'Proof already reviewed' });

    const task = db.prepare('SELECT reward_amount FROM tasks WHERE id=?').get(proof.task_id);

    // Update proof status
    db.prepare(`
      UPDATE user_tasks SET status='approved', reviewed_by=?, reviewed_at=datetime('now') WHERE id=?
    `).run(req.user.id, req.params.id);

    // Credit wallet
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(task.reward_amount, proof.user_id);
    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, source, reference_id, note)
      VALUES (?, ?, ?, 'credit', 'task', ?, 'Task reward approved')
    `).run(uuidv4(), proof.user_id, task.reward_amount, proof.id);

    auditLog(req.user.id, 'approve_proof', 'user_task', req.params.id, { user_id: proof.user_id, amount: task.reward_amount });
    res.json({ message: `Proof approved. ₹${task.reward_amount} credited to user.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve proof' });
  }
});

router.post('/proofs/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;
    const proof = db.prepare('SELECT * FROM user_tasks WHERE id=?').get(req.params.id);
    if (!proof) return res.status(404).json({ error: 'Proof not found' });
    if (proof.status !== 'pending') return res.status(400).json({ error: 'Proof already reviewed' });

    db.prepare(`
      UPDATE user_tasks SET status='rejected', reviewed_by=?, reviewed_at=datetime('now'), reject_reason=? WHERE id=?
    `).run(req.user.id, reason || 'Did not meet requirements', req.params.id);

    auditLog(req.user.id, 'reject_proof', 'user_task', req.params.id, { reason });
    res.json({ message: 'Proof rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject proof' });
  }
});

// ─── KYC REVIEW ───────────────────────────────────────────────────────────────
router.get('/kyc', (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const records = db.prepare(`
      SELECT k.*, u.email
      FROM kyc k JOIN users u ON k.user_id = u.id
      WHERE k.status = ?
      ORDER BY k.submitted_at DESC
    `).all(status);
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC records' });
  }
});

router.post('/kyc/:id/approve', (req, res) => {
  try {
    const kyc = db.prepare('SELECT * FROM kyc WHERE id=?').get(req.params.id);
    if (!kyc) return res.status(404).json({ error: 'KYC record not found' });
    if (kyc.status !== 'pending') return res.status(400).json({ error: 'KYC already reviewed' });

    db.prepare("UPDATE kyc SET status='approved', reviewed_by=?, reviewed_at=datetime('now'), review_note=NULL WHERE id=?").run(req.user.id, req.params.id);
    db.prepare("UPDATE users SET kyc_status='approved', upi_id=? WHERE id=?").run(kyc.upi_id, kyc.user_id);

    auditLog(req.user.id, 'approve_kyc', 'kyc', req.params.id, { user_id: kyc.user_id });
    res.json({ message: 'KYC approved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

router.post('/kyc/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;
    const kyc = db.prepare('SELECT * FROM kyc WHERE id=?').get(req.params.id);
    if (!kyc) return res.status(404).json({ error: 'KYC record not found' });

    db.prepare("UPDATE kyc SET status='rejected', reviewed_by=?, reviewed_at=datetime('now'), review_note=? WHERE id=?").run(req.user.id, reason || 'Documents not valid', req.params.id);
    db.prepare("UPDATE users SET kyc_status='rejected' WHERE id=?").run(kyc.user_id);

    auditLog(req.user.id, 'reject_kyc', 'kyc', req.params.id, { reason });
    res.json({ message: 'KYC rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

// ─── WITHDRAWAL REVIEW ────────────────────────────────────────────────────────
router.get('/withdrawals', (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const withdrawals = db.prepare(`
      SELECT w.*, u.email as user_email
      FROM withdrawals w JOIN users u ON w.user_id = u.id
      WHERE w.status = ?
      ORDER BY w.created_at DESC
    `).all(status);
    res.json({ withdrawals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

router.post('/withdrawals/:id/approve', (req, res) => {
  try {
    const w = db.prepare('SELECT * FROM withdrawals WHERE id=?').get(req.params.id);
    if (!w) return res.status(404).json({ error: 'Withdrawal not found' });
    if (w.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    db.prepare("UPDATE withdrawals SET status='approved', processed_at=datetime('now'), processed_by=? WHERE id=?").run(req.user.id, req.params.id);

    // Update transaction note
    db.prepare("UPDATE transactions SET note='Withdrawal approved and processed' WHERE reference_id=? AND type='debit'").run(req.params.id);

    auditLog(req.user.id, 'approve_withdrawal', 'withdrawal', req.params.id, { user_id: w.user_id, amount: w.amount });
    res.json({ message: `Withdrawal of ₹${w.amount} approved` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

router.post('/withdrawals/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;
    const w = db.prepare('SELECT * FROM withdrawals WHERE id=?').get(req.params.id);
    if (!w) return res.status(404).json({ error: 'Withdrawal not found' });
    if (w.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    db.prepare("UPDATE withdrawals SET status='rejected', processed_at=datetime('now'), processed_by=?, reject_reason=? WHERE id=?").run(req.user.id, reason || 'Request rejected', req.params.id);

    // Refund balance
    db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(w.amount, w.user_id);
    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, source, reference_id, note)
      VALUES (?, ?, ?, 'credit', 'withdrawal_refund', ?, 'Withdrawal rejected - amount refunded')
    `).run(uuidv4(), w.user_id, w.amount, w.id);

    auditLog(req.user.id, 'reject_withdrawal', 'withdrawal', req.params.id, { reason, user_id: w.user_id });
    res.json({ message: 'Withdrawal rejected and balance refunded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

// ─── USERS LIST ───────────────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, wallet_balance, kyc_status, created_at,
        (SELECT COUNT(*) FROM user_tasks WHERE user_id=users.id AND status='approved') as completed_tasks
      FROM users WHERE role='user' ORDER BY created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── SETTINGS ────────────────────────────────────────────────────────────────
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.entries(updates).forEach(([k, v]) => stmt.run(k, String(v)));
    auditLog(req.user.id, 'update_settings', 'settings', null, updates);
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT al.*, u.email as admin_email
      FROM audit_logs al JOIN users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC LIMIT 100
    `).all();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
