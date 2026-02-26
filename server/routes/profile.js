// routes/profile.js - User profile routes for Sub4Earn
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, wallet_balance, kyc_status, referral_code, upi_id, created_at,
        (SELECT COUNT(*) FROM user_tasks WHERE user_id = users.id AND status = 'approved') as completed_tasks,
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = users.id) as total_referrals,
        (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE user_id = users.id AND type = 'credit') as total_earned
      FROM users WHERE id = ?
    `).get(req.user.id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── PUT /api/profile/upi - Update UPI ID ─────────────────────────────────────
router.put('/upi', (req, res) => {
  try {
    const { upi_id } = req.body;
    if (!upi_id || upi_id.trim().length < 5) return res.status(400).json({ error: 'Valid UPI ID is required' });
    db.prepare('UPDATE users SET upi_id = ? WHERE id = ?').run(upi_id.trim(), req.user.id);
    res.json({ message: 'UPI ID updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update UPI ID' });
  }
});

// ─── PUT /api/profile/password - Change password ─────────────────────────────
router.put('/password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'All fields are required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ─── GET /api/profile/referrals - Referral history ───────────────────────────
router.get('/referrals', (req, res) => {
  try {
    const referrals = db.prepare(`
      SELECT r.created_at, u.email as referred_email, r.bonus_credited
      FROM referrals r JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = ? ORDER BY r.created_at DESC
    `).all(req.user.id);
    const user = db.prepare('SELECT referral_code FROM users WHERE id = ?').get(req.user.id);
    res.json({ referral_code: user.referral_code, referrals });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referral data' });
  }
});

module.exports = router;
