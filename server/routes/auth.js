// routes/auth.js - Authentication routes for Sub4Earn
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const db = require('../database');

const router = express.Router();

// Rate limit login: 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { email, password, referral_code } = req.body;

    // Validate
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Find referrer
    let referrerId = null;
    if (referral_code) {
      const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referral_code.toUpperCase());
      if (referrer) referrerId = referrer.id;
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 12);
    const myReferralCode = generateReferralCode();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, referral_code, referred_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase(), password_hash, myReferralCode, referrerId);

    // Handle referral bonus
    if (referrerId) {
      const refBonus = parseFloat(db.prepare("SELECT value FROM settings WHERE key='referral_bonus'").get()?.value || '10');
      const bonusId = uuidv4();
      db.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").run(refBonus, referrerId);
      db.prepare("INSERT INTO transactions (id, user_id, amount, type, source, note) VALUES (?, ?, ?, 'credit', 'referral', ?)").run(bonusId, referrerId, refBonus, `Referral bonus for inviting ${email}`);
      db.prepare("INSERT INTO referrals (id, referrer_id, referred_id, bonus_credited) VALUES (?, ?, ?, 1)").run(uuidv4(), referrerId, id);
    }

    const user = db.prepare('SELECT id, email, role, wallet_balance, kyc_status FROM users WHERE id = ?').get(id);
    const token = signToken(user);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user.id, email: user.email, role: user.role, wallet_balance: user.wallet_balance, kyc_status: user.kyc_status },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, wallet_balance: user.wallet_balance, kyc_status: user.kyc_status },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, role, wallet_balance, kyc_status, referral_code, upi_id, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

module.exports = router;
