const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// ─── GET /api/announcements ───────────────────────────────────────────────────
// Tüm duyuruları getir (herkes görebilir)
router.get('/', (req, res) => {
  const announcements = db.prepare(`
    SELECT a.*, u.name as creator_name
    FROM announcements a
    JOIN users u ON a.created_by = u.id
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all();
  res.json(announcements);
});

// ─── POST /api/announcements ──────────────────────────────────────────────────
// Yeni duyuru oluştur (Admin/Müdür)
router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const { title, content, priority } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Başlık ve içerik zorunludur.' });
  }

  const result = db.prepare(`
    INSERT INTO announcements (title, content, priority, created_by)
    VALUES (?, ?, ?, ?)
  `).run(title, content, priority || 'normal', req.user.id);

  const newAnnouncement = db.prepare(`
    SELECT a.*, u.name as creator_name
    FROM announcements a JOIN users u ON a.created_by = u.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(newAnnouncement);
});

// ─── DELETE /api/announcements/:id ───────────────────────────────────────────
// Duyuru sil (Admin her duyuruyu, Müdür sadece kendi duyurusunu silebilir)
router.delete('/:id', requireRole('admin', 'manager'), (req, res) => {
  const { id } = req.params;
  const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);

  if (!announcement) return res.status(404).json({ error: 'Duyuru bulunamadı.' });

  if (req.user.role === 'manager' && announcement.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Sadece kendi duyurularınızı silebilirsiniz.' });
  }

  db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
  res.json({ message: 'Duyuru silindi.' });
});

module.exports = router;
