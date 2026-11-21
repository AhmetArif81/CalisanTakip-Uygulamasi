const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// ─── GET /api/leaves ──────────────────────────────────────────────────────────
// Tüm izin taleplerini getir
router.get('/', (req, res) => {
  let query = `
    SELECT l.*, u.name as user_name, u.department,
           r.name as reviewer_name
    FROM leaves l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN users r ON l.reviewed_by = r.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'employee') {
    query += ' AND l.user_id = ?';
    params.push(req.user.id);
  }

  const { status } = req.query;
  if (status) {
    query += ' AND l.status = ?';
    params.push(status);
  }

  query += ' ORDER BY l.created_at DESC';
  const leaves = db.prepare(query).all(...params);
  res.json(leaves);
});

// ─── POST /api/leaves ─────────────────────────────────────────────────────────
// Yeni izin talebi oluştur
router.post('/', (req, res) => {
  const { start_date, end_date, type, reason } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Başlangıç ve bitiş tarihi zorunludur.' });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ error: 'Başlangıç tarihi bitiş tarihinden sonra olamaz.' });
  }

  // Çakışan izin var mı?
  const conflict = db.prepare(`
    SELECT id FROM leaves
    WHERE user_id = ? AND status != 'rejected'
    AND NOT (end_date < ? OR start_date > ?)
  `).get(req.user.id, start_date, end_date);

  if (conflict) {
    return res.status(409).json({ error: 'Bu tarihler için zaten bir izin talebiniz bulunuyor.' });
  }

  const result = db.prepare(`
    INSERT INTO leaves (user_id, start_date, end_date, type, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, start_date, end_date, type || 'annual', reason || '');

  const newLeave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newLeave);
});

// ─── PUT /api/leaves/:id/approve ─────────────────────────────────────────────
// İzni onayla (Admin/Müdür)
router.put('/:id/approve', requireRole('admin', 'manager'), (req, res) => {
  const { id } = req.params;
  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id);

  if (!leave) return res.status(404).json({ error: 'İzin talebi bulunamadı.' });
  if (leave.status !== 'pending') return res.status(400).json({ error: 'Bu talep zaten işleme alınmış.' });

  db.prepare(`
    UPDATE leaves SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.user.id, id);

  const updated = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id);
  res.json({ message: 'İzin onaylandı.', leave: updated });
});

// ─── PUT /api/leaves/:id/reject ──────────────────────────────────────────────
// İzni reddet (Admin/Müdür)
router.put('/:id/reject', requireRole('admin', 'manager'), (req, res) => {
  const { id } = req.params;
  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id);

  if (!leave) return res.status(404).json({ error: 'İzin talebi bulunamadı.' });
  if (leave.status !== 'pending') return res.status(400).json({ error: 'Bu talep zaten işleme alınmış.' });

  db.prepare(`
    UPDATE leaves SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.user.id, id);

  const updated = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id);
  res.json({ message: 'İzin reddedildi.', leave: updated });
});

// ─── DELETE /api/leaves/:id ───────────────────────────────────────────────────
// İzin talebini iptal et (sadece kendi pending talebi)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id);

  if (!leave) return res.status(404).json({ error: 'İzin talebi bulunamadı.' });

  if (req.user.role === 'employee' && leave.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Yetkiniz yok.' });
  }

  if (leave.status !== 'pending') {
    return res.status(400).json({ error: 'Sadece bekleyen talepler iptal edilebilir.' });
  }

  db.prepare('DELETE FROM leaves WHERE id = ?').run(id);
  res.json({ message: 'İzin talebi iptal edildi.' });
});

module.exports = router;
