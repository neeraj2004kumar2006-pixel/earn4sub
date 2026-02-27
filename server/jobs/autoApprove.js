// server/jobs/autoApprove.js

const db = require("../database");

// Ye function server start hote hi chalega
function startAutoApprovalJob() {
  console.log("Auto approval system started");

  // Har 30 second me check karega pending tasks
  setInterval(async () => {
    try {
      await db.query(
        `UPDATE tasks 
         SET status = 'approved' 
         WHERE status = 'pending' 
         AND created_at <= NOW() - INTERVAL 1200 SECOND`
      );

      console.log("Checked and auto-approved eligible tasks");
    } catch (error) {
      console.error("Auto approval error:", error);
    }
  }, 30000); // 30 seconds me check karega
}

module.exports = { startAutoApprovalJob };
