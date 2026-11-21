const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// ─── GET /api/attendance ──────────────────────────────────────────────────────
// Tüm devam kayıtlarını getir (Admin/Müdür: hepsi, Personel: sadece kendi)
router.get('/', (req, res) => {
  const { date, userId, month } = req.query;
  let query = `
    SELECT a.*, u.name as user_name, u.department
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  // Personel sadece kendi kayıtlarını görebilir
  if (req.user.role === 'employee') {
    query += ' AND a.user_id = ?';
    params.push(req.user.id);
  } else if (userId) {
    query += ' AND a.user_id = ?';
    params.push(userId);
  }

  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }

  if (month) {
    query += " AND strftime('%Y-%m', a.date) = ?";
    params.push(month);
  }

  query += ' ORDER BY a.date DESC, u.name ASC';

  const records = db.prepare(query).all(...params);
  res.json(records);
});

// ─── GET /api/attendance/today ────────────────────────────────────────────────
// Bugünün devam durumu özeti (Admin/Müdür)
router.get('/today', requireRole('admin', 'manager'), (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const summary = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE is_active=1 AND role='employee') as total_employees,
      (SELECT COUNT(*) FROM attendance WHERE date=? AND status='present') as present,
      (SELECT COUNT(*) FROM attendance WHERE date=? AND status='late') as late,
      (SELECT COUNT(*) FROM attendance WHERE date=? AND status='absent') as absent,
      (SELECT COUNT(*) FROM leaves WHERE status='approved' AND ? BETWEEN start_date AND end_date) as on_leave
  `).get(today, today, today, today);

  res.json(summary);
});

// ─── POST /api/attendance/checkin ─────────────────────────────────────────────
// Giriş saatini kaydet (İstek üzerine doğrudan 09:00 olarak kaydeder)
router.post('/checkin', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const now = req.body?.time || '09:00'; // Doğrudan 09:00 olarak kaydet

  // Bugün zaten giriş yapılmış mı?
  const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);

  if (existing) {
    if (existing.check_in) {
      return res.status(400).json({ error: 'Bugün zaten giriş yapıldı.' });
    }
    db.prepare('UPDATE attendance SET check_in = ?, status = ? WHERE id = ?').run(now, getStatus(now), existing.id);
  } else {
    db.prepare('INSERT INTO attendance (user_id, date, check_in, status) VALUES (?, ?, ?, ?)').run(
      req.user.id, today, now, getStatus(now)
    );
  }

  const record = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
  res.json({ message: `Giriş kaydedildi: ${now}`, record });
});

// ─── POST /api/attendance/checkout ────────────────────────────────────────────
// Çıkış saatini kaydet (İstek üzerine doğrudan 17:00 olarak kaydeder)
router.post('/checkout', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const now = req.body?.time || '17:00'; // Doğrudan 17:00 olarak kaydet

  const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);

  if (!existing || !existing.check_in) {
    return res.status(400).json({ error: 'Önce giriş yapmanız gerekiyor.' });
  }

  if (existing.check_out) {
    return res.status(400).json({ error: 'Bugün zaten çıkış yapıldı.' });
  }

  db.prepare('UPDATE attendance SET check_out = ? WHERE id = ?').run(now, existing.id);
  const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id);
  res.json({ message: `Çıkış kaydedildi: ${now}`, record });
});

// ─── GET /api/attendance/stats/:userId ───────────────────────────────────────
// Personelin devam istatistikleri
router.get('/stats/:userId', (req, res) => {
  const { userId } = req.params;

  if (req.user.role === 'employee' && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ error: 'Yetkiniz yok.' });
  }

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days
    FROM attendance WHERE user_id = ?
  `).get(userId);

  res.json(stats);
});

// ─── Yardımcı Fonksiyon: Geç Kalma Kontrolü ──────────────────────────────────
function getStatus(time) {
  const [h, m] = time.split(':').map(Number);
  const minutes = h * 60 + m;
  return minutes > 9 * 60 + 15 ? 'late' : 'present'; // 09:15'ten sonra = geç
}

module.exports = router;
