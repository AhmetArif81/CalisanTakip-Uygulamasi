const jwt = require('jsonwebtoken');
require('dotenv').config();

// ─── JWT Token Doğrulama Middleware ──────────────────────────────────────────
// Her korumalı route'dan önce bu fonksiyon çalışır.
// Header'daki token'ı alır, doğrular ve kullanıcı bilgisini req.user'a ekler.

function authenticateToken(req, res, next) {
  // Header'dan token'ı al: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı. Lütfen giriş yapın.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
    req.user = user; // { id, username, role, name }
    next();
  });
}

// ─── Rol Kontrolü Middleware ──────────────────────────────────────────────────
// Belirtilen rollere sahip olmayan kullanıcıların erişimini engeller.
// Kullanım: requireRole('admin') veya requireRole('admin', 'manager')

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
