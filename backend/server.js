require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());                           // Cross-origin isteklere izin ver
app.use(express.json());                   // JSON body parse
app.use(express.urlencoded({ extended: true }));

// ─── Frontend Dosyaları (Static) ──────────────────────────────────────────────
// Frontend klasöründeki HTML/CSS/JS dosyalarını sun
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── API Rotaları ─────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/leaves',        require('./routes/leaves'));
app.use('/api/announcements', require('./routes/announcements'));

// ─── Ana Sayfa → Login ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('/api/*splat', (req, res) => {
  res.status(404).json({ error: 'API endpoint bulunamadı.' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Sunucu hatası:', err.stack);
  res.status(500).json({ error: 'Sunucu hatası oluştu.' });
});

// ─── Sunucuyu Başlat ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🏢 Personel Takip Sistemi            ║');
  console.log('║   ✅ Sunucu başlatıldı!                ║');
  console.log(`║   🌐 http://localhost:${PORT}             ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('📋 Demo Hesaplar:');
  console.log('   admin   / admin123  (Admin)');
  console.log('   mudur   / mudur123  (Müdür)');
  console.log('   ayse    / ayse123   (Personel)');
  console.log('   mehmet  / mehmet123 (Personel)');
  console.log('');
});
