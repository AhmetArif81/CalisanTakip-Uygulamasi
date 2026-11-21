/**
 * utils.js — Yardımcı fonksiyonlar
 */

// ─── Toast Bildirimleri ───────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  document.body.appendChild(div);
  return div;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// ESC ile modal kapat
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
      m.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }
});

// Overlay'e tıklayınca kapat
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// ─── Tarih / Saat Formatları ──────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(timeStr) {
  return timeStr || '-';
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Badge Oluşturucular ──────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    present:  ['badge-success', '✅ Mevcut'],
    late:     ['badge-warning', '⏰ Geç'],
    absent:   ['badge-danger',  '❌ Devamsız'],
    pending:  ['badge-warning', '⏳ Bekliyor'],
    approved: ['badge-success', '✅ Onaylandı'],
    rejected: ['badge-danger',  '❌ Reddedildi'],
    active:   ['badge-success', '✅ Aktif'],
    inactive: ['badge-muted',   '⛔ Pasif'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function roleBadge(role) {
  const map = {
    admin:    ['badge-danger',  '🔴 Admin'],
    manager:  ['badge-primary', '🔵 Müdür'],
    employee: ['badge-info',    '🟢 Personel'],
  };
  const [cls, label] = map[role] || ['badge-muted', role];
  return `<span class="badge ${cls}">${label}</span>`;
}

function leaveTypeBadge(type) {
  const map = {
    annual:   ['badge-primary', '🏖️ Yıllık'],
    sick:     ['badge-danger',  '🏥 Hastalık'],
    personal: ['badge-warning', '👤 Kişisel'],
  };
  const [cls, label] = map[type] || ['badge-muted', type];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ─── Avatar oluştur ───────────────────────────────────────────────────────────
function makeAvatar(name, size = '') {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  return `<div class="avatar ${size}" style="background: linear-gradient(135deg, ${colors[colorIndex]}, ${colors[(colorIndex + 1) % colors.length]})">${initials}</div>`;
}

// ─── Boş Durum ────────────────────────────────────────────────────────────────
function emptyState(icon, title, desc = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>${title}</h3>
      ${desc ? `<p>${desc}</p>` : ''}
    </div>
  `;
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner"></div> Yükleniyor...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText || btn.dataset.originalText || btn.innerHTML;
  }
}

// ─── Gün hesabı ───────────────────────────────────────────────────────────────
function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return diff;
}

// ─── Saat Farkı ──────────────────────────────────────────────────────────────
function timeDiff(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '-';
  const [h1, m1] = checkIn.split(':').map(Number);
  const [h2, m2] = checkOut.split(':').map(Number);
  const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (totalMin <= 0) return '-';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}s ${m}dk`;
}

// ─── Tema Yönetimi (Açık Beyaz / Koyu Karanlık Tema) ─────────────────────────
function getStoredTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeButtons(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getStoredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(next === 'light' ? '☀️ Beyaz tema aktif' : '🌙 Karanlık tema aktif', 'info');
}

function updateThemeButtons(theme) {
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    const icon = btn.querySelector('.theme-toggle-icon');
    const label = btn.querySelector('.theme-toggle-label');
    if (theme === 'light') {
      if (icon) icon.textContent = '☀️';
      if (label) label.textContent = 'Açık Tema';
      btn.title = 'Karanlık temaya geç';
    } else {
      if (icon) icon.textContent = '🌙';
      if (label) label.textContent = 'Koyu Tema';
      btn.title = 'Açık temaya geç';
    }
  });
}

function initTheme() {
  const saved = getStoredTheme();
  applyTheme(saved);

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.removeEventListener('click', toggleTheme);
    btn.addEventListener('click', toggleTheme);
  });
}

// Otomatik başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}

// Global olarak erişilebilir
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatTime = formatTime;
window.todayISO = todayISO;
window.currentMonthISO = currentMonthISO;
window.statusBadge = statusBadge;
window.roleBadge = roleBadge;
window.leaveTypeBadge = leaveTypeBadge;
window.makeAvatar = makeAvatar;
window.emptyState = emptyState;
window.setButtonLoading = setButtonLoading;
window.daysBetween = daysBetween;
window.timeDiff = timeDiff;
window.getStoredTheme = getStoredTheme;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;

