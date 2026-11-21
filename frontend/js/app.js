/**
 * app.js — Ana uygulama başlatıcı
 * Sidebar yönetimi, navigasyon, saat güncelleme
 */

// ─── Sayfa Yükleme Kontrolü ───────────────────────────────────────────────────
const currentUser = getUser();
const token = localStorage.getItem('token');

if (!currentUser || !token) {
  window.location.href = '/';
}

// ─── Menü Yapıları (Role Göre) ────────────────────────────────────────────────
const MENUS = {
  admin: [
    { section: 'Ana Sayfa', items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard', page: 'dashboard' },
    ]},
    { section: 'Personel', items: [
      { id: 'users',      icon: '👥', label: 'Personel Yönetimi', page: 'users' },
      { id: 'attendance', icon: '📅', label: 'Devam Takibi',      page: 'attendance' },
      { id: 'leaves',     icon: '🏖️', label: 'İzin Talepleri',    page: 'leaves', badge: 'pendingLeaves' },
    ]},
    { section: 'Sistem', items: [
      { id: 'announcements', icon: '📢', label: 'Duyurular', page: 'announcements' },
      { id: 'reports',       icon: '📈', label: 'Raporlar',  page: 'reports' },
    ]},
  ],
  manager: [
    { section: 'Ana Sayfa', items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard', page: 'dashboard' },
    ]},
    { section: 'Takip', items: [
      { id: 'users',      icon: '👥', label: 'Personel Listesi', page: 'users' },
      { id: 'attendance', icon: '📅', label: 'Devam Takibi',     page: 'attendance' },
      { id: 'leaves',     icon: '🏖️', label: 'İzin Onayları',   page: 'leaves', badge: 'pendingLeaves' },
    ]},
    { section: 'İletişim', items: [
      { id: 'announcements', icon: '📢', label: 'Duyurular', page: 'announcements' },
    ]},
  ],
  employee: [
    { section: 'Ana Sayfa', items: [
      { id: 'dashboard', icon: '📊', label: 'Özet', page: 'dashboard' },
    ]},
    { section: 'İşlemler', items: [
      { id: 'checkin',  icon: '🕐', label: 'Giriş / Çıkış',  page: 'checkin' },
      { id: 'leaves',   icon: '🏖️', label: 'İzin Taleplerim', page: 'leaves' },
    ]},
    { section: 'Bilgi', items: [
      { id: 'announcements', icon: '📢', label: 'Duyurular', page: 'announcements' },
    ]},
  ],
};

// ─── Sidebar Render ───────────────────────────────────────────────────────────
function renderSidebar() {
  const user = currentUser;
  const role = user.role;

  // Kullanıcı bilgisi
  document.getElementById('sidebarAvatar').innerHTML = makeAvatar(user.name);
  document.getElementById('sidebarUserName').textContent = user.name;
  const roleLabels = { admin: '🔴 Admin', manager: '🔵 Müdür', employee: '🟢 Personel' };
  document.getElementById('sidebarUserRole').textContent = roleLabels[role] || role;

  // Nav menü
  const nav = document.getElementById('sidebarNav');
  const menu = MENUS[role] || MENUS.employee;

  nav.innerHTML = menu.map(section => `
    <div class="nav-section">
      <div class="nav-section-title">${section.section}</div>
      ${section.items.map(item => `
        <button class="nav-item" id="nav-${item.id}" onclick="navigate('${item.page}')" type="button">
          <span class="nav-item-icon">${item.icon}</span>
          <span>${item.label}</span>
          ${item.badge ? `<span class="nav-item-badge hidden" id="badge-${item.badge}">0</span>` : ''}
        </button>
      `).join('')}
    </div>
  `).join('');
}

// ─── Navigasyon ───────────────────────────────────────────────────────────────
let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;

  // Aktif nav item güncelle
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.getElementById(`nav-${page}`);
  if (activeItem) activeItem.classList.add('active');

  // Sayfa başlıkları
  const pageTitles = {
    dashboard:     { title: 'Dashboard', sub: 'Genel bakış' },
    users:         { title: 'Personel Yönetimi', sub: 'Tüm personel listesi' },
    attendance:    { title: 'Devam Takibi', sub: 'Giriş / çıkış kayıtları' },
    leaves:        { title: 'İzin Talepleri', sub: 'İzin yönetimi' },
    announcements: { title: 'Duyurular', sub: 'Şirket duyuruları' },
    reports:       { title: 'Raporlar', sub: 'Devam raporları' },
    checkin:       { title: 'Giriş / Çıkış', sub: 'Günlük devam kaydı' },
  };

  const meta = pageTitles[page] || { title: page, sub: '' };
  document.getElementById('pageTitle').textContent = meta.title;
  document.getElementById('pageSubtitle').textContent = meta.sub;
  document.title = `${meta.title} — Personel Takip`;

  // İçeriği render et
  renderPage(page);

  // Mobilde sidebar'ı kapat
  closeSidebar();
}

// ─── Sayfa Render Router ──────────────────────────────────────────────────────
let _renderSeq = 0;

async function renderPage(page) {
  const role = currentUser.role;
  const content = document.getElementById('pageContent');
  const seq = ++_renderSeq;

  content.innerHTML = '<div id="pageLoading" style="text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:2rem">⏳</div><p>Yükleniyor...</p></div>';

  // Güvenlik ağı: bir hata/yavaş yanıt nedeniyle ekran "Yükleniyor..."da kalmasın
  const watchdog = setTimeout(() => {
    const loading = document.getElementById('pageLoading');
    if (seq === _renderSeq && loading) {
      loading.innerHTML = `
        <div style="font-size:2rem">⚠️</div>
        <p style="margin-top:8px">Sayfa yüklenemedi veya sunucu yanıt vermedi.</p>
        <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="renderPage('${page}')">Tekrar Dene</button>
      `;
    }
  }, 15000);

  // Role ve sayfaya göre doğru fonksiyonu çağır
  try {
    if (page === 'dashboard') {
      if (role === 'admin') await renderAdminDashboard();
      else if (role === 'manager') await renderManagerDashboard();
      else await renderEmployeeDashboard();
    } else if (page === 'users') {
      await renderUsersPage();
    } else if (page === 'attendance') {
      await renderAttendancePage();
    } else if (page === 'leaves') {
      await renderLeavesPage();
    } else if (page === 'announcements') {
      await renderAnnouncementsPage();
    } else if (page === 'reports') {
      await renderReportsPage();
    } else if (page === 'checkin') {
      await renderCheckinPage();
    } else {
      content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><h3>Bu sayfa yapım aşamasında</h3></div>`;
    }
  } catch (err) {
    console.error('Sayfa render hatası:', page, err);
    content.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Sayfa yüklenemedi</h3><p>${err.message}</p><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="renderPage('${page}')">Tekrar Dene</button></div></div>`;
  } finally {
    clearTimeout(watchdog);
  }
}

// ─── Saat Güncelleme ──────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('navbarTime').textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('navbarDate').textContent = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}

setInterval(updateClock, 1000);
updateClock();

// ─── Sidebar Mobil Kontrol ────────────────────────────────────────────────────
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('visible');
});

document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

// ─── Çıkış Yap ───────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  showToast('Çıkış yapıldı. Görüşürüz! 👋', 'info');
  setTimeout(() => window.location.href = '/', 700);
});

// ─── Bekleyen İzin Sayısını Güncelle ─────────────────────────────────────────
async function updatePendingLeaveBadge() {
  try {
    const leaves = await API.getLeaves({ status: 'pending' });
    const badge = document.getElementById('badge-pendingLeaves');
    if (badge && leaves.length > 0) {
      badge.textContent = leaves.length;
      badge.classList.remove('hidden');
    }
  } catch (e) { /* sessizce geç */ }
}

// ─── Başlat ───────────────────────────────────────────────────────────────────
function initApp() {
  try {
    renderSidebar();
    navigate('dashboard');
  } catch (err) {
    console.error('Uygulama başlatılırken hata:', err);
    const content = document.getElementById('pageContent');
    if (content) {
      content.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Sayfa yüklenemedi</h3><p>${err.message}</p></div></div>`;
    }
  }

  // Admin/Müdür için bekleyen izin badge
  if (currentUser.role !== 'employee') {
    updatePendingLeaveBadge();
    setInterval(updatePendingLeaveBadge, 60000); // Her dakika güncelle
  }
}

// DOM ve tüm script dosyaları hazır olduktan sonra başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
