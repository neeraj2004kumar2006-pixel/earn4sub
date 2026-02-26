// seed.js - Seed demo data for Sub4Earn
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

async function seed() {
  console.log('🌱 Seeding Sub4Earn database...');

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const existingAdmin = db.prepare("SELECT id FROM users WHERE email='admin@sub4earn.com'").get();
  if (!existingAdmin) {
    const adminHash = await bcrypt.hash('admin123', 12);
    db.prepare(`INSERT INTO users (id, email, password_hash, role, kyc_status, referral_code, email_verified)
      VALUES (?, 'admin@sub4earn.com', ?, 'admin', 'approved', 'ADMIN1', 1)
    `).run(uuidv4(), adminHash);
    console.log('  ✅ Admin user created: admin@sub4earn.com / admin123');
  } else {
    console.log('  ℹ️  Admin user already exists');
  }

  // ─── Demo User ──────────────────────────────────────────────────────────────
  const existingUser = db.prepare("SELECT id FROM users WHERE email='demo@sub4earn.com'").get();
  let demoUserId;
  if (!existingUser) {
    const userHash = await bcrypt.hash('demo123', 12);
    demoUserId = uuidv4();
    db.prepare(`INSERT INTO users (id, email, password_hash, role, wallet_balance, referral_code, email_verified)
      VALUES (?, 'demo@sub4earn.com', ?, 'user', 75.00, 'DEMO01', 1)
    `).run(demoUserId, userHash);

    // Seed demo transactions
    db.prepare("INSERT INTO transactions (id, user_id, amount, type, source, note) VALUES (?,?,50,'credit','task','Task reward for Tech Channel')").run(uuidv4(), demoUserId);
    db.prepare("INSERT INTO transactions (id, user_id, amount, type, source, note) VALUES (?,?,25,'credit','task','Task reward for Gaming Channel')").run(uuidv4(), demoUserId);

    console.log('  ✅ Demo user created: demo@sub4earn.com / demo123 (₹75 balance)');
  } else {
    demoUserId = existingUser.id;
    console.log('  ℹ️  Demo user already exists');
  }

  // ─── Sample Tasks ────────────────────────────────────────────────────────────
  const taskCount = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c;
  if (taskCount === 0) {
    const adminId = db.prepare("SELECT id FROM users WHERE email='admin@sub4earn.com'").get().id;
    const tasks = [
      { title: 'Subscribe to TechBurner', youtube_url: 'https://www.youtube.com/@TechBurner', reward: 15, limit: 100 },
      { title: 'Subscribe to Technical Guruji', youtube_url: 'https://www.youtube.com/@TechnicalGuruji', reward: 20, limit: 50 },
      { title: 'Subscribe to CarryMinati', youtube_url: 'https://www.youtube.com/@CarryMinati', reward: 25, limit: 75 },
      { title: 'Subscribe to Amit Bhadana', youtube_url: 'https://www.youtube.com/@AmitBhadana', reward: 20, limit: 80 },
      { title: 'Subscribe to BB Ki Vines', youtube_url: 'https://www.youtube.com/@BBKiVines', reward: 18, limit: 60 },
      { title: 'Subscribe to MostlySane', youtube_url: 'https://www.youtube.com/@MostlySane', reward: 15, limit: 100 },
      { title: 'Subscribe to Round2Hell', youtube_url: 'https://www.youtube.com/@Round2Hell', reward: 22, limit: 50 },
      { title: 'Subscribe to Flying Beast', youtube_url: 'https://www.youtube.com/@FlyingBeast320', reward: 18, limit: 70 },
    ];

    tasks.forEach(t => {
      db.prepare(`
        INSERT INTO tasks (id, title, youtube_url, reward_amount, max_limit, active, created_by)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(uuidv4(), t.title, t.youtube_url, t.reward, t.limit, adminId);
    });
    console.log(`  ✅ ${tasks.length} sample tasks created`);
  } else {
    console.log('  ℹ️  Tasks already seeded');
  }

  console.log('\n✨ Seeding complete!\n');
  console.log('  Admin:     admin@sub4earn.com / admin123');
  console.log('  Demo User: demo@sub4earn.com / demo123\n');
}

seed().catch(console.error);
