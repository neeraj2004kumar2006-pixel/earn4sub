// seed.js - Seed demo data for Sub4Earn
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

// All 35 YouTube subscribe tasks (reward will be overwritten to 3.8 by database.js migration)
const YOUTUBE_TASKS = [
  { title: 'Subscribe to TechBurner',          url: 'https://www.youtube.com/@TechBurner' },
  { title: 'Subscribe to Technical Guruji',    url: 'https://www.youtube.com/@TechnicalGuruji' },
  { title: 'Subscribe to CarryMinati',          url: 'https://www.youtube.com/@CarryMinati' },
  { title: 'Subscribe to Amit Bhadana',         url: 'https://www.youtube.com/@AmitBhadana' },
  { title: 'Subscribe to BB Ki Vines',          url: 'https://www.youtube.com/@BBKiVines' },
  { title: 'Subscribe to MostlySane',           url: 'https://www.youtube.com/@MostlySane' },
  { title: 'Subscribe to Round2Hell',           url: 'https://www.youtube.com/@Round2Hell' },
  { title: 'Subscribe to Flying Beast',         url: 'https://www.youtube.com/@FlyingBeast320' },
  { title: 'Subscribe to Ashish Chanchlani',    url: 'https://www.youtube.com/@AshishChanchlaniVines' },
  { title: 'Subscribe to Triggered Insaan',     url: 'https://www.youtube.com/@TriggeredInsaan' },
  { title: 'Subscribe to Sourav Joshi Vlogs',   url: 'https://www.youtube.com/@SouravJoshiVlogs' },
  { title: 'Subscribe to Thugesh',              url: 'https://www.youtube.com/@Thugesh' },
  { title: 'Subscribe to Mythpat',              url: 'https://www.youtube.com/@Mythpat' },
  { title: 'Subscribe to Fukra Insaan',         url: 'https://www.youtube.com/@FukraInsaan' },
  { title: 'Subscribe to Elvish Yadav',         url: 'https://www.youtube.com/@ElvishYadavVlogs' },
  { title: 'Subscribe to Ranveer Allahbadia',   url: 'https://www.youtube.com/@BeerBiceps' },
  { title: 'Subscribe to Nikhil Sharma',        url: 'https://www.youtube.com/@NikhilSharmaOfficial' },
  { title: 'Subscribe to Lakshay Chaudhary',    url: 'https://www.youtube.com/@LakshayChaudhary' },
  { title: 'Subscribe to Tanmay Bhatt',         url: 'https://www.youtube.com/@TanmayBhat' },
  { title: 'Subscribe to Slayy Point',          url: 'https://www.youtube.com/@SlayyPoint' },
  { title: 'Subscribe to Bhuvan Bam',           url: 'https://www.youtube.com/@BBKiVines2' },
  { title: 'Subscribe to Harsh Beniwal',        url: 'https://www.youtube.com/@HarshBeniwal' },
  { title: 'Subscribe to Mumbiker Nikhil',      url: 'https://www.youtube.com/@MumbikerNikhil' },
  { title: 'Subscribe to Rajat Dalal',          url: 'https://www.youtube.com/@RajatDalal' },
  { title: 'Subscribe to Dhruv Rathee',         url: 'https://www.youtube.com/@dhruvrathee' },
  { title: 'Subscribe to Abhi and Niyu',        url: 'https://www.youtube.com/@abhiandniyu' },
  { title: 'Subscribe to Vivek Bindra',         url: 'https://www.youtube.com/@VivekBindra' },
  { title: 'Subscribe to Sandeep Maheshwari',   url: 'https://www.youtube.com/@SandeepMaheshwari' },
  { title: 'Subscribe to Ankur Warikoo',        url: 'https://www.youtube.com/@warikoo' },
  { title: 'Subscribe to Think School',         url: 'https://www.youtube.com/@ThinkSchool' },
  { title: 'Subscribe to Varun Mayya',          url: 'https://www.youtube.com/@VarunMayya' },
  { title: 'Subscribe to Ishan Sharma',         url: 'https://www.youtube.com/@IshanSharma7390' },
  { title: 'Subscribe to Gaurav Taneja',        url: 'https://www.youtube.com/@FlyingBeastOfficial' },
  { title: 'Subscribe to Technical Dost',       url: 'https://www.youtube.com/@TechnicalDost' },
  { title: 'Subscribe to Nishant Chahar',       url: 'https://www.youtube.com/@NishantChahar' },
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
