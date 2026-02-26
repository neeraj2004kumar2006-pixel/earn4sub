// middleware/auth.js - JWT authentication middleware for Sub4Earn
const jwt = require('jsonwebtoken');
const db = require('../database');

/**
 * Verifies JWT token and attaches user to req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, wallet_balance, kyc_status FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restricts route to admin role only
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Log an admin action to audit_logs table
 */
function auditLog(adminId, action, targetType, targetId, details) {
  const { v4: uuidv4 } = require('uuid');
  try {
    db.prepare(
      'INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uuidv4(), adminId, action, targetType, targetId, JSON.stringify(details));
  } catch (_) {}
}

module.exports = { authenticate, requireAdmin, auditLog };
