// routes/tasks.js - Task routes for Sub4Earn users
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/tasks - List all active tasks with user status ──────────────────
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*,
        ut.status AS user_status,
        ut.proof_image_url,
        ut.submitted_at,
        ut.reject_reason,
        (SELECT COUNT(*) FROM user_tasks WHERE task_id = t.id AND status = 'approved') AS completions
      FROM tasks t
      LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = ?
      WHERE t.active = 1
      ORDER BY t.created_at DESC
    `).all(req.user.id);
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ─── POST /api/tasks/:id/submit - Submit proof screenshot ─────────────────────
router.post('/:id/submit', (req, res, next) => {
  req.uploadFolder = 'proofs';
  next();
}, upload.single('proof'), (req, res) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user.id;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND active = 1').get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found or inactive' });

    // Check max limit
    if (task.max_limit > 0) {
      const count = db.prepare("SELECT COUNT(*) as c FROM user_tasks WHERE task_id = ? AND status = 'approved'").get(taskId).c;
      if (count >= task.max_limit) return res.status(400).json({ error: 'Task has reached maximum completions' });
    }

    // Check duplicate
    const existing = db.prepare('SELECT * FROM user_tasks WHERE user_id = ? AND task_id = ?').get(userId, taskId);
    if (existing) {
      if (existing.status === 'pending') return res.status(400).json({ error: 'You already submitted this task, awaiting review' });
      if (existing.status === 'approved') return res.status(400).json({ error: 'You already completed this task' });
      // Rejected - allow resubmission
    }

    if (!req.file) return res.status(400).json({ error: 'Proof screenshot is required' });

    const proofUrl = `/uploads/proofs/${req.file.filename}`;

    if (existing) {
      // Update rejected submission
      db.prepare(`
        UPDATE user_tasks SET status = 'pending', proof_image_url = ?, reviewed_by = NULL, reviewed_at = NULL, reject_reason = NULL, submitted_at = datetime('now')
        WHERE user_id = ? AND task_id = ?
      `).run(proofUrl, userId, taskId);
    } else {
      db.prepare(`
        INSERT INTO user_tasks (id, user_id, task_id, status, proof_image_url)
        VALUES (?, ?, ?, 'pending', ?)
      `).run(uuidv4(), userId, taskId, proofUrl);
    }

    res.json({ message: 'Proof submitted successfully. Awaiting admin review.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit proof' });
  }
});

// ─── GET /api/tasks/my - User's submitted tasks ───────────────────────────────
router.get('/my', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT ut.*, t.title, t.youtube_url, t.reward_amount
      FROM user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      WHERE ut.user_id = ?
      ORDER BY ut.submitted_at DESC
    `).all(req.user.id);
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your tasks' });
  }
});

module.exports = router;
