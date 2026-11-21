const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Kullanıcı adı ve şifre ile giriş yapar, JWT token döner
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
  }

  // Veritabanında kullanıcıyı bul
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);

  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  // Şifreyi kontrol et (bcrypt karşılaştırma)
  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  // JWT token oluştur
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      department: user.department,
      email: user.email
    }
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Mevcut kullanıcının bilgilerini döner (token ile)
const { authenticateToken } = require('../middleware/auth');

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, username, role, department, phone, email, hire_date FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  res.json(user);
});

module.exports = router;
