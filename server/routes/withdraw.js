// routes/withdraw.js - Withdrawal routes for Sub4Earn
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/withdraw - Withdrawal info and history ──────────────────────────
router.get('/', (req, res) => {
  try {
    const user = db.prepare('SELECT wallet_balance, kyc_status, upi_id FROM users WHERE id = ?').get(req.user.id);
    const minWithdrawal = parseFloat(db.prepare("SELECT value FROM settings WHERE key='min_withdrawal'").get()?.value || '50');
    const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ wallet_balance: user.wallet_balance, kyc_status: user.kyc_status, upi_id: user.upi_id, min_withdrawal: minWithdrawal, withdrawals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch withdrawal data' });
  }
});

// ─── POST /api/withdraw/request - Submit withdrawal request ───────────────────
router.post('/request', (req, res) => {
  try {
    const { amount, upi_id } = req.body;
    const userId = req.user.id;

    // KYC check
    const user = db.prepare('SELECT wallet_balance, kyc_status FROM users WHERE id = ?').get(userId);
    if (user.kyc_status !== 'approved') return res.status(400).json({ error: 'KYC verification required before withdrawal' });

    // Validate amount
    const minWithdrawal = parseFloat(db.prepare("SELECT value FROM settings WHERE key='min_withdrawal'").get()?.value || '50');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < minWithdrawal) return res.status(400).json({ error: `Minimum withdrawal is ₹${minWithdrawal}` });
    if (amt > user.wallet_balance) return res.status(400).json({ error: 'Insufficient balance' });

    if (!upi_id || upi_id.trim().length < 5) return res.status(400).json({ error: 'Valid UPI ID is required' });

    // Check pending request
    const pending = db.prepare("SELECT id FROM withdrawals WHERE user_id = ? AND status = 'pending'").get(userId);
    if (pending) return res.status(400).json({ error: 'You already have a pending withdrawal request' });

    // Reserve amount by deducting from balance
    db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(amt, userId);

    // Create withdrawal record
    const wid = uuidv4();
    db.prepare(`
      INSERT INTO withdrawals (id, user_id, amount, upi_id, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(wid, userId, amt, upi_id.trim());

    // Create debit transaction (pending approval)
    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, source, reference_id, note)
      VALUES (?, ?, ?, 'debit', 'withdrawal', ?, 'Withdrawal request submitted')
    `).run(uuidv4(), userId, amt, wid);

    res.json({ message: 'Withdrawal request submitted successfully. Will be processed within 24-48 hours.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit withdrawal request' });
  }
});

module.exports = router;
