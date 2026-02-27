// seed.js - Seed demo data for Sub4Earn
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

// All 35 YouTube subscribe tasks (reward will be overwritten to 3.8 by database.js migration)
const YOUTUBE_TASKS = [
  { title: 'Subscribe to S U B 4 E A R N', url: 'https://youtube.com/@sub4earn287?si=CusNbNgTXLMg6jtf' },
  { title: 'Subscribe to CodeWithRavi', url: 'https://youtube.com/@CodeWithRavi' },
  { title: 'Subscribe to DailyTechBites', url: 'https://youtube.com/@DailyTechBites' },
  { title: 'Subscribe to SmartEarningTips', url: 'https://youtube.com/@SmartEarningTips' },
  { title: 'Subscribe to OnlineHustleLab', url: 'https://youtube.com/@OnlineHustleLab' },
  { title: 'Subscribe to StudyWithNeel', url: 'https://youtube.com/@StudyWithNeel' },
  { title: 'Subscribe to DevJourneyHindi', url: 'https://youtube.com/@DevJourneyHindi' },
  { title: 'Subscribe to FinanceStarter', url: 'https://youtube.com/@FinanceStarter' },
  { title: 'Subscribe to CodingMitra', url: 'https://youtube.com/@CodingMitra' },
  { title: 'Subscribe to DigitalSkillZone', url: 'https://youtube.com/@DigitalSkillZone' },
  { title: 'Subscribe to SmallCreatorHub', url: 'https://youtube.com/@SmallCreatorHub' },
  { title: 'Subscribe to TechSimplifiedNow', url: 'https://youtube.com/@TechSimplifiedNow' },
  { title: 'Subscribe to GrowthWithAman', url: 'https://youtube.com/@GrowthWithAman' },
  { title: 'Subscribe to LearnFreelancing', url: 'https://youtube.com/@LearnFreelancing' },
  { title: 'Subscribe to StartupBasics', url: 'https://youtube.com/@StartupBasics' },
  { title: 'Subscribe to MiniVlogStudio', url: 'https://youtube.com/@MiniVlogStudio' },
  { title: 'Subscribe to CodingStepByStep', url: 'https://youtube.com/@CodingStepByStep' },
  { title: 'Subscribe to StudyBooster', url: 'https://youtube.com/@StudyBooster' },
  { title: 'Subscribe to EarnOnlineGuide', url: 'https://youtube.com/@EarnOnlineGuide' },
  { title: 'Subscribe to TechExplainerHindi', url: 'https://youtube.com/@TechExplainerHindi' },
  { title: 'Subscribe to BeginnerCoderClub', url: 'https://youtube.com/@BeginnerCoderClub' },
  { title: 'Subscribe to MicroVlogChannel', url: 'https://youtube.com/@MicroVlogChannel' },
  { title: 'Subscribe to DigitalGrowthPoint', url: 'https://youtube.com/@DigitalGrowthPoint' },
  { title: 'Subscribe to StudyRoomLive', url: 'https://youtube.com/@StudyRoomLive' },
  { title: 'Subscribe to CreatorBoostLab', url: 'https://youtube.com/@CreatorBoostLab' },
  { title: 'Subscribe to TechUpdatesDaily', url: 'https://youtube.com/@TechUpdatesDaily' },
  { title: 'Subscribe to SimpleCodingHindi', url: 'https://youtube.com/@SimpleCodingHindi' },
  { title: 'Subscribe to FreelancePathway', url: 'https://youtube.com/@FreelancePathway' },
  { title: 'Subscribe to HustleMindsetTV', url: 'https://youtube.com/@HustleMindsetTV' },
  { title: 'Subscribe to SmallBizStarter', url: 'https://youtube.com/@SmallBizStarter' },
  { title: 'Subscribe to SkillGrowthAcademy', url: 'https://youtube.com/@SkillGrowthAcademy' },
  { title: 'Subscribe to DevHindiTutorials', url: 'https://youtube.com/@DevHindiTutorials' },
  { title: 'Subscribe to CreatorJourneyNow', url: 'https://youtube.com/@CreatorJourneyNow' },
  { title: 'Subscribe to MiniTechCreator', url: 'https://youtube.com/@MiniTechCreator' },
  { title: 'Subscribe to DigitalLearningSpot', url: 'https://youtube.com/@DigitalLearningSpot' }
];

const REWARD = 3.8;
const MAX_LIMIT = 500;

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

    db.prepare("INSERT INTO transactions (id, user_id, amount, type, source, note) VALUES (?,?,50,'credit','task','Task reward for Tech Channel')").run(uuidv4(), demoUserId);
    db.prepare("INSERT INTO transactions (id, user_id, amount, type, source, note) VALUES (?,?,25,'credit','task','Task reward for Gaming Channel')").run(uuidv4(), demoUserId);

    console.log('  ✅ Demo user created: demo@sub4earn.com / demo123 (₹75 balance)');
  } else {
    demoUserId = existingUser.id;
    console.log('  ℹ️  Demo user already exists');
  }

  // ─── 35 YouTube Tasks ────────────────────────────────────────────────────────
  const adminId = db.prepare("SELECT id FROM users WHERE email='admin@sub4earn.com'").get().id;

  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO tasks (id, title, youtube_url, reward_amount, max_limit, active, created_by)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);

  let added = 0;
  for (const t of YOUTUBE_TASKS) {
    const exists = db.prepare('SELECT id FROM tasks WHERE youtube_url = ?').get(t.url);
    if (!exists) {
      insertTask.run(uuidv4(), t.title, t.url, REWARD, MAX_LIMIT, adminId);
      added++;
    }
  }

  const total = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c;

  // Ensure all existing tasks also have the correct reward (migration safety)
  db.prepare('UPDATE tasks SET reward_amount = 3.8').run();

  console.log(`  ✅ Tasks: ${added} added, ${total} total in DB (all set to ₹${REWARD})`);

  console.log('\n✨ Seeding complete!\n');
  console.log('  Admin:     admin@sub4earn.com / admin123');
  console.log('  Demo User: demo@sub4earn.com / demo123\n');
}

module.exports = seed;
