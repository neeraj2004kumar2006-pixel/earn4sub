// routes/kyc.js - KYC routes for Sub4Earn
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/kyc - Get user KYC status ───────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const kyc = db.prepare('SELECT * FROM kyc WHERE user_id = ?').get(req.user.id);
    res.json({ kyc: kyc || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC data' });
  }
});

// ─── GET /api/kyc/payment-info - Payment details for KYC fee ──────────────────
router.get('/payment-info', (req, res) => {
  res.json({
    upi_id: 'sunita2546@fam',
    amount: 90,
  });
});

// ─── POST /api/kyc/submit - Submit KYC form with UTR ──────────────────────────
router.post('/submit', (req, res, next) => {
  req.uploadFolder = 'kyc';
  next();
}, upload.fields([{ name: 'id_proof', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]), (req, res) => {
  try {
    const { full_name, mobile, email, upi_id, utr_number } = req.body;

    // Existing field validation
    if (!full_name || !mobile || !email || !upi_id)
      return res.status(400).json({ error: 'All fields are required' });
    if (!/^\d{10}$/.test(mobile))
      return res.status(400).json({ error: 'Mobile must be 10 digits' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email format' });
    if (!req.files?.id_proof || !req.files?.selfie)
      return res.status(400).json({ error: 'ID proof and selfie images are required' });

    // UTR validation
    if (!utr_number)
      return res.status(400).json({ error: 'UTR number is required' });
    if (!/^\d{12}$/.test(utr_number.trim()))
      return res.status(400).json({ error: 'UTR must be exactly 12 numeric digits' });

    const existing = db.prepare('SELECT * FROM kyc WHERE user_id = ?').get(req.user.id);
    if (existing && existing.status === 'pending')
      return res.status(400).json({ error: 'KYC already submitted and pending review' });
    if (existing && existing.status === 'approved')
      return res.status(400).json({ error: 'KYC already approved' });

    const idProofUrl = `/uploads/kyc/${req.files.id_proof[0].filename}`;
    const selfieUrl = `/uploads/kyc/${req.files.selfie[0].filename}`;

    if (existing) {
      // Resubmit after rejection
      db.prepare(`
        UPDATE kyc SET full_name=?, mobile=?, email=?, upi_id=?, id_proof_url=?, selfie_url=?,
        utr_number=?, payment_status='pending',
        status='pending', review_note=NULL, reviewed_at=NULL, reviewed_by=NULL, submitted_at=datetime('now')
        WHERE user_id=?
      `).run(full_name.trim(), mobile, email.toLowerCase(), upi_id.trim(), idProofUrl, selfieUrl, utr_number.trim(), req.user.id);
    } else {
      db.prepare(`
        INSERT INTO kyc (id, user_id, full_name, mobile, email, upi_id, id_proof_url, selfie_url, utr_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), req.user.id, full_name.trim(), mobile, email.toLowerCase(), upi_id.trim(), idProofUrl, selfieUrl, utr_number.trim());
    }

    // Update user KYC status to pending
    db.prepare("UPDATE users SET kyc_status = 'pending' WHERE id = ?").run(req.user.id);

    res.json({ message: 'KYC submitted successfully. Awaiting admin review.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
});

module.exports = router;
