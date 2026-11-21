const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Tüm route'lar için token gerekli
router.use(authenticateToken);

// ─── GET /api/users ───────────────────────────────────────────────────────────
// Tüm personeli listele (Admin ve Müdür görebilir)
router.get('/', requireRole('admin', 'manager'), (req, res) => {
  const users = db.prepare(`
    SELECT id, name, username, role, department, phone, email, hire_date, is_active, created_at
    FROM users ORDER BY name ASC
  `).all();
  res.json(users);
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
// Tek personel bilgisi
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // Personel sadece kendi bilgisini görebilir
  if (req.user.role === 'employee' && req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: 'Yetkiniz yok.' });
  }
  const user = db.prepare(`
    SELECT id, name, username, role, department, phone, email, hire_date, is_active, created_at
    FROM users WHERE id = ?
  `).get(id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  res.json(user);
});

// ─── POST /api/users ──────────────────────────────────────────────────────────
// Yeni personel ekle (Sadece Admin)
router.post('/', requireRole('admin'), (req, res) => {
  const { name, username, password, role, department, phone, email, hire_date } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Ad, kullanıcı adı, şifre ve rol zorunludur.' });
  }

  // Kullanıcı adı müsait mi?
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(`
      INSERT INTO users (name, username, password, role, department, phone, email, hire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, username, hashedPassword, role, department || '', phone || '', email || '', hire_date || '');

    const newUser = db.prepare('SELECT id, name, username, role, department, phone, email, hire_date FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: 'Personel eklenirken hata oluştu.' });
  }
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
// Personel bilgisi güncelle (Admin her şeyi, personel sadece kendi telefon/emailini)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === parseInt(id);

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ error: 'Yetkiniz yok.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  const { name, username, password, role, department, phone, email, hire_date, is_active } = req.body;

  // Admin olmayan kullanıcılar sadece kendi telefon, e-posta ve şifrelerini değiştirebilir
  const updatedName = isAdmin ? (name || user.name) : user.name;
  const updatedUsername = isAdmin ? (username || user.username) : user.username;
  const updatedRole = isAdmin ? (role || user.role) : user.role;
  const updatedDepartment = isAdmin ? (department !== undefined ? department : user.department) : user.department;
  const updatedHireDate = isAdmin ? (hire_date || user.hire_date) : user.hire_date;
  const updatedIsActive = isAdmin ? (is_active !== undefined ? is_active : user.is_active) : user.is_active;

  // Kullanıcı adı değişiyorsa çakışma kontrolü yap
  if (updatedUsername !== user.username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(updatedUsername, id);
    if (existing) {
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda.' });
    }
  }

  let hashedPassword = user.password;
  if (password) {
    hashedPassword = bcrypt.hashSync(password, 10);
  }

  try {
    db.prepare(`
      UPDATE users SET name=?, username=?, password=?, role=?, department=?, phone=?, email=?, hire_date=?, is_active=?
      WHERE id=?
    `).run(
      updatedName,
      updatedUsername,
      hashedPassword,
      updatedRole,
      updatedDepartment,
      phone !== undefined ? phone : user.phone,
      email !== undefined ? email : user.email,
      updatedHireDate,
      updatedIsActive,
      id
    );
  } catch (err) {
    return res.status(500).json({ error: 'Personel güncellenirken hata oluştu.' });
  }

  const updated = db.prepare('SELECT id, name, username, role, department, phone, email, hire_date, is_active FROM users WHERE id = ?').get(id);
  res.json(updated);
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
// Personel sil (Sadece Admin, kendini silemez)
router.delete('/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;

  if (req.user.id === parseInt(id)) {
    return res.status(400).json({ error: 'Kendinizi silemezsiniz.' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'Personel başarıyla silindi.' });
});

module.exports = router;
