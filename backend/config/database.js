const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Veritabanı dosyasının yolu
const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

// Performans için WAL modu
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Tabloları Oluştur ────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    department TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    hire_date TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT DEFAULT 'present',
    note TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    type TEXT DEFAULT 'annual',
    reason TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Demo Verilerini Ekle (ilk çalışmada) ────────────────────────────────────

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return; // Zaten veri varsa atla

  console.log('🌱 Demo veriler ekleniyor...');

  const insertUser = db.prepare(`
    INSERT INTO users (name, username, password, role, department, phone, email, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    { name: 'Admin Kullanıcı', username: 'admin', password: 'admin123', role: 'admin', dept: 'Yönetim', phone: '0532 111 1111', email: 'admin@sirket.com', hire: '2020-01-01' },
    { name: 'Ahmet Müdür', username: 'mudur', password: 'mudur123', role: 'manager', dept: 'Yönetim', phone: '0532 222 2222', email: 'mudur@sirket.com', hire: '2020-03-15' },
    { name: 'Ayşe Kaya', username: 'ayse', password: 'ayse123', role: 'employee', dept: 'Muhasebe', phone: '0532 333 3333', email: 'ayse@sirket.com', hire: '2021-06-01' },
    { name: 'Mehmet Demir', username: 'mehmet', password: 'mehmet123', role: 'employee', dept: 'Satış', phone: '0532 444 4444', email: 'mehmet@sirket.com', hire: '2022-01-10' },
    { name: 'Fatma Yıldız', username: 'fatma', password: 'fatma123', role: 'employee', dept: 'İK', phone: '0532 555 5555', email: 'fatma@sirket.com', hire: '2021-09-20' },
  ];

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    insertUser.run(u.name, u.username, hash, u.role, u.dept, u.phone, u.email, u.hire);
  }

  // Demo devam kayıtları (son 7 gün)
  const insertAttendance = db.prepare(`
    INSERT OR IGNORE INTO attendance (user_id, date, check_in, check_out, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // Hafta sonu atla
    const dateStr = d.toISOString().split('T')[0];
    insertAttendance.run(3, dateStr, '09:00', '17:00', 'present'); // Ayşe
    insertAttendance.run(4, dateStr, '09:00', '17:00', 'present'); // Mehmet
    insertAttendance.run(5, dateStr, '09:00', '17:00', 'present'); // Fatma
  }

  // Demo izin talebi
  db.prepare(`
    INSERT INTO leaves (user_id, start_date, end_date, type, reason, status)
    VALUES (3, '2026-10-20', '2026-10-22', 'annual', 'Yıllık izin', 'pending')
  `).run();

  // Demo duyuru
  db.prepare(`
    INSERT INTO announcements (title, content, priority, created_by)
    VALUES (?, ?, ?, 1)
  `).run(
    'Personel Takip Sistemine Hoş Geldiniz!',
    'Yeni personel takip sistemimiz aktif olmuştur. Sorularınız için yönetimle iletişime geçiniz.',
    'high'
  );

  console.log('✅ Demo veriler başarıyla eklendi!');
}

seedData();

module.exports = db;
