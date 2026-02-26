// jobs/autoApprove.js - Auto-approval job for Sub4Earn
// Automatically approves pending task submissions after 120 seconds
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const AUTO_APPROVE_SECONDS = 120; // 2 minutes
const CHECK_INTERVAL_MS = 30_000;  // check every 30 seconds

/**
 * Find all pending user_tasks submitted >= 120 seconds ago and approve them,
 * crediting the wallet. Uses a DB transaction to prevent double-crediting.
 */
const approveOne = db.transaction((task) => {
  // Re-check inside transaction to prevent race condition
  const current = db.prepare('SELECT status FROM user_tasks WHERE id = ?').get(task.id);
  if (!current || current.status !== 'pending') return false;

  // Mark approved by system
  db.prepare(`
    UPDATE user_tasks
    SET status = 'approved', reviewed_by = 'system_auto', reviewed_at = datetime('now')
    WHERE id = ? AND status = 'pending'
  `).run(task.id);

  // Credit wallet
  db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?')
    .run(task.reward_amount, task.user_id);

  // Create credit transaction
  db.prepare(`
    INSERT INTO transactions (id, user_id, amount, type, source, reference_id, note)
    VALUES (?, ?, ?, 'credit', 'task', ?, 'Task reward auto-approved after 2 minutes')
  `).run(uuidv4(), task.user_id, task.reward_amount, task.id);

  return true;
});

function runAutoApproval() {
  try {
    const pendingTasks = db.prepare(`
      SELECT ut.id, ut.user_id, ut.status, t.reward_amount
      FROM user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      WHERE ut.status = 'pending'
        AND datetime(ut.submitted_at) <= datetime('now', '-${AUTO_APPROVE_SECONDS} seconds')
    `).all();

    if (pendingTasks.length === 0) return;

    let approved = 0;
    for (const task of pendingTasks) {
      try {
        const ok = approveOne(task);
        if (ok) approved++;
      } catch (err) {
        console.error('[AutoApprove] Error processing task', task.id, err.message);
      }
    }
    if (approved > 0) {
      console.log(`[AutoApprove] Auto-approved ${approved} task(s) at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error('[AutoApprove] Job error:', err.message);
  }
}

function startAutoApprovalJob() {
  // Run once at startup (picks up any tasks that were pending before restart)
  runAutoApproval();
  // Then run every 30 seconds
  setInterval(runAutoApproval, CHECK_INTERVAL_MS);
  console.log(`[AutoApprove] Job started — approves tasks after ${AUTO_APPROVE_SECONDS}s, checks every ${CHECK_INTERVAL_MS / 1000}s`);
}

module.exports = { startAutoApprovalJob };
