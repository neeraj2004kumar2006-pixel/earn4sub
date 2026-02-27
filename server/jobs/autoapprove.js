// server/jobs/autoApprove.js

const db = require("../database");

// Auto approve task after 120 seconds (2 minutes)
function autoApproveTask(taskId) {
  setTimeout(async () => {
    try {
      await db.query(
        "UPDATE tasks SET status = ? WHERE id = ? AND status = ?",
        ["approved", taskId, "pending"]
      );

      console.log(`Task ${taskId} auto-approved after 120 seconds`);
    } catch (error) {
      console.error("Auto approval failed:", error);
    }
  }, 1200000); // 120000 ms = 120 seconds
}

module.exports = autoApproveTask;
