// routes/wallet.js - Wallet and transaction routes for Sub4Earn
const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/wallet - Wallet summary ─────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(req.user.id);
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN type='debit' THEN amount ELSE 0 END), 0) as total_withdrawn
      FROM transactions WHERE user_id = ?
    `).get(req.user.id);

    const transactions = db.prepare(`
      SELECT * FROM transactions WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 50
    `).all(req.user.id);

    res.json({
      wallet_balance: user.wallet_balance,
      total_earned: stats.total_earned,
      total_withdrawn: stats.total_withdrawn,
      total_transactions: stats.total_transactions,
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch wallet data' });
  }
});

module.exports = router;
