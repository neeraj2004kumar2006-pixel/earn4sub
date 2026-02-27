// resetAdminPassword.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

async function reset() {
  const newPassword = "newStrongPassword123"; // <-- yaha apna naya password daalo
  const hash = await bcrypt.hash(newPassword, 12);

  db.prepare(`
    UPDATE users
    SET password_hash = ?
    WHERE email = 'admin@sub4earn.com'
  `).run(hash);

  console.log("✅ Admin password updated successfully");
}

reset();
