/**
 * admin.js — Admin paneli sayfa render fonksiyonları
 */

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
async function renderAdminDashboard() {
  const content = document.getElementById('pageContent');

  try {
    const [summary, users, leaves, announcements] = await Promise.all([
      API.getTodaySummary(),
      API.getUsers(),
      API.getLeaves({ status: 'pending' }),
      API.getAnnouncements(),
    ]);

    const employees = users.filter(u => u.role === 'employee');
    const activeUsers = users.filter(u => u.is_active);

    content.innerHTML = `
      <!-- İstatistik Kartları -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15)">👥</div>
          <div class="stat-info">
            <div class="stat-label">Toplam Personel</div>
            <div class="stat-value">${employees.length}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15)">✅</div>
          <div class="stat-info">
            <div class="stat-label">Bugün Mevcut</div>
            <div class="stat-value">${summary.present + summary.late}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15)">⏰</div>
          <div class="stat-info">
            <div class="stat-label">Geç Gelen</div>
            <div class="stat-value">${summary.late}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15)">❌</div>
          <div class="stat-info">
            <div class="stat-label">Devamsız</div>
            <div class="stat-value">${summary.absent}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(6,182,212,0.15)">🏖️</div>
          <div class="stat-info">
            <div class="stat-label">İzinde</div>
            <div class="stat-value">${summary.on_leave}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(139,92,246,0.15)">⏳</div>
          <div class="stat-info">
            <div class="stat-label">Bekleyen İzin</div>
            <div class="stat-value">${leaves.length}</div>
          </div>
        </div>
      </div>

      <!-- Hızlı Eylemler -->
      <div class="content-grid" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">⚡ Hızlı İşlemler</h3>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <button class="btn btn-primary" onclick="navigate('users');setTimeout(()=>openUserModal(),100)">
              ➕ Personel Ekle
            </button>
            <button class="btn btn-outline" onclick="navigate('attendance')">
              📅 Devam Takibi
            </button>
            <button class="btn btn-outline" onclick="navigate('leaves')">
              🏖️ İzin Talepleri ${leaves.length > 0 ? `<span class="badge badge-danger" style="margin-left:4px">${leaves.length}</span>` : ''}
            </button>
            <button class="btn btn-outline" onclick="navigate('announcements');setTimeout(()=>openAnnouncementModal(),100)">
              📢 Duyuru Yap
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📊 Bugünün Özeti</h3>
            <span class="badge badge-info">${new Date().toLocaleDateString('tr-TR')}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${buildProgressBar('Mevcut', summary.present + summary.late, employees.length, '#10b981')}
            ${buildProgressBar('Geç Gelen', summary.late, employees.length, '#f59e0b')}
            ${buildProgressBar('İzinde', summary.on_leave, employees.length, '#06b6d4')}
            ${buildProgressBar('Devamsız', summary.absent, employees.length, '#ef4444')}
          </div>
        </div>
      </div>

      <!-- Bekleyen İzinler & Son Duyurular -->
      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">⏳ Bekleyen İzin Talepleri</h3>
            <button class="btn btn-outline btn-sm" onclick="navigate('leaves')">Tümünü Gör</button>
          </div>
          ${leaves.length === 0
            ? emptyState('🎉', 'Bekleyen talep yok')
            : leaves.slice(0, 5).map(l => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border)">
                <div style="display:flex; align-items:center; gap:10px">
                  ${makeAvatar(l.user_name, 'avatar-sm')}
                  <div>
                    <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary)">${l.user_name}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted)">${formatDate(l.start_date)} — ${formatDate(l.end_date)}</div>
                  </div>
                </div>
                <div style="display:flex; gap:6px">
                  <button class="btn btn-success btn-sm" onclick="quickApproveLeave(${l.id})">✅</button>
                  <button class="btn btn-danger btn-sm" onclick="quickRejectLeave(${l.id})">❌</button>
                </div>
              </div>
            `).join('')
          }
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📢 Son Duyurular</h3>
            <button class="btn btn-outline btn-sm" onclick="navigate('announcements')">Tümünü Gör</button>
          </div>
          ${announcements.length === 0
            ? emptyState('📭', 'Henüz duyuru yok')
            : announcements.slice(0, 3).map(a => `
              <div class="announcement-item priority-${a.priority}">
                <div class="announcement-title">${a.title}</div>
                <div class="announcement-meta">
                  <span>👤 ${a.creator_name}</span>
                  <span>•</span>
                  <span>📅 ${formatDateTime(a.created_at)}</span>
                </div>
                <div class="announcement-content">${a.content.length > 80 ? a.content.slice(0, 80) + '...' : a.content}</div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
}

// ─── Personel Yönetimi Sayfası ────────────────────────────────────────────────
async function renderUsersPage() {
  const content = document.getElementById('pageContent');

  try {
    const users = await API.getUsers();

    content.innerHTML = `
      <div class="page-header">
        <h2>👥 Personel Yönetimi <span class="badge badge-primary" style="font-size:0.8rem">${users.length} kişi</span></h2>
        ${currentUser.role === 'admin' ? `<button class="btn btn-primary" onclick="openUserModal()" id="addUserBtn">➕ Personel Ekle</button>` : ''}
      </div>

      <div class="filter-bar">
        <input type="text" class="search-input" id="userSearch" placeholder="🔍 İsim, departman ara..." oninput="filterUsers()">
        <select class="form-control" id="roleFilter" style="width:auto" onchange="filterUsers()">
          <option value="">Tüm Roller</option>
          <option value="admin">Admin</option>
          <option value="manager">Müdür</option>
          <option value="employee">Personel</option>
        </select>
      </div>

      <div class="card" style="padding:0">
        <div class="table-container">
          <table class="data-table" id="usersTable">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Kullanıcı Adı</th>
                <th>Rol</th>
                <th>Departman</th>
                <th>Telefon</th>
                <th>İşe Başlama</th>
                <th>Durum</th>
                ${currentUser.role === 'admin' ? '<th style="text-align:center">İşlemler</th>' : ''}
              </tr>
            </thead>
            <tbody id="usersTableBody">
              ${users.map(u => userRow(u)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Arama verisini sakla
    window._usersData = users;

  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
}

function userRow(u) {
  const isAdmin = currentUser.role === 'admin';
  return `
    <tr id="user-row-${u.id}">
      <td>
        <div class="user-cell">
          ${makeAvatar(u.name, 'avatar-sm')}
          <div class="user-cell-info">
            <div class="user-name">${u.name}</div>
            <div class="user-dept">${u.email || ''}</div>
          </div>
        </div>
      </td>
      <td><code style="color:var(--text-accent)">${u.username}</code></td>
      <td>${roleBadge(u.role)}</td>
      <td>${u.department || '-'}</td>
      <td>${u.phone || '-'}</td>
      <td>${u.hire_date ? formatDate(u.hire_date) : '-'}</td>
      <td>${u.is_active ? '<span class="badge badge-success">✅ Aktif</span>' : '<span class="badge badge-muted">⛔ Pasif</span>'}</td>
      ${isAdmin ? `
        <td style="text-align:center">
          <div style="display:flex; justify-content:center; gap:6px">
            <button class="btn btn-outline btn-sm" onclick="openUserModal(${u.id})" title="Düzenle">✏️</button>
            ${u.id !== currentUser.id ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id}, '${u.name}')" title="Sil">🗑️</button>` : ''}
          </div>
        </td>
      ` : ''}
    </tr>
  `;
}

function filterUsers() {
  const search = document.getElementById('userSearch').value.toLowerCase();
  const role = document.getElementById('roleFilter').value;
  const users = (window._usersData || []).filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search) || (u.department || '').toLowerCase().includes(search) || u.username.toLowerCase().includes(search);
    const matchRole = !role || u.role === role;
    return matchSearch && matchRole;
  });
  document.getElementById('usersTableBody').innerHTML = users.map(userRow).join('') || `<tr><td colspan="8">${emptyState('🔍', 'Sonuç bulunamadı')}</td></tr>`;
}

// ─── Personel Modal ───────────────────────────────────────────────────────────
window._editingUserId = null;

async function openUserModal(userId = null) {
  window._editingUserId = userId;
  document.getElementById('userModalTitle').textContent = userId ? 'Personeli Düzenle' : 'Personel Ekle';
  document.getElementById('userForm').reset();
  document.getElementById('passwordLabel').textContent = userId ? '(boş bırakılırsa değişmez)' : '(zorunlu)';

  if (userId) {
    try {
      const u = await API.getUser(userId);
      document.getElementById('formName').value = u.name;
      document.getElementById('formUsername').value = u.username;
      document.getElementById('formRole').value = u.role;
      document.getElementById('formDept').value = u.department || '';
      document.getElementById('formPhone').value = u.phone || '';
      document.getElementById('formEmail').value = u.email || '';
      document.getElementById('formHireDate').value = u.hire_date || '';
    } catch (e) {
      showToast('Personel bilgisi alınamadı.', 'error');
      return;
    }
  }
  openModal('userModal');
}

async function saveUser() {
  const btn = document.getElementById('userFormSaveBtn');
  const originalText = btn.innerHTML;
  const isEdit = !!window._editingUserId;

  const body = {
    name:      document.getElementById('formName').value.trim(),
    username:  document.getElementById('formUsername').value.trim(),
    password:  document.getElementById('formPassword').value,
    role:      document.getElementById('formRole').value,
    department:document.getElementById('formDept').value.trim(),
    phone:     document.getElementById('formPhone').value.trim(),
    email:     document.getElementById('formEmail').value.trim(),
    hire_date: document.getElementById('formHireDate').value,
  };

  if (!body.name || !body.username || (!isEdit && !body.password)) {
    showToast('Ad, kullanıcı adı ve şifre zorunludur.', 'warning');
    return;
  }

  setButtonLoading(btn, true);
  try {
    if (isEdit) {
      await API.updateUser(window._editingUserId, body);
      showToast('Personel güncellendi! ✅', 'success');
    } else {
      await API.createUser(body);
      showToast('Personel eklendi! ✅', 'success');
    }
    closeModal('userModal');
    renderUsersPage();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false, originalText);
  }
}

async function deleteUser(id, name) {
  if (!confirm(`"${name}" adlı personeli silmek istediğinize emin misiniz?`)) return;
  try {
    await API.deleteUser(id);
    showToast(`${name} silindi.`, 'success');
    renderUsersPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Devam Takibi Sayfası ─────────────────────────────────────────────────────
async function renderAttendancePage() {
  const content = document.getElementById('pageContent');
  const today = todayISO();
  const month = currentMonthISO();

  try {
    const [records, users] = await Promise.all([
      API.getAttendance({ month }),
      API.getUsers(),
    ]);

    const employees = users.filter(u => u.role === 'employee');

    content.innerHTML = `
      <div class="page-header">
        <h2>📅 Devam Takibi</h2>
      </div>

      <div class="filter-bar">
        <input type="date" class="form-control" id="attDateFilter" value="${today}" style="width:auto" onchange="filterAttendance()">
        <select class="form-control" id="attStatusFilter" style="width:auto" onchange="filterAttendance()">
          <option value="">Tüm Durumlar</option>
          <option value="present">Mevcut</option>
          <option value="late">Geç</option>
          <option value="absent">Devamsız</option>
        </select>
      </div>

      <div class="card" style="padding:0">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Personel</th>
                <th>Departman</th>
                <th>Tarih</th>
                <th>Giriş</th>
                <th>Çıkış</th>
                <th>Çalışma</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody id="attendanceTableBody">
              ${records.length === 0
                ? `<tr><td colspan="7">${emptyState('📋', 'Kayıt bulunamadı', 'Seçili tarih/filtre için kayıt yok')}</td></tr>`
                : records.map(r => `
                  <tr>
                    <td>
                      <div class="user-cell">
                        ${makeAvatar(r.user_name, 'avatar-sm')}
                        <span>${r.user_name}</span>
                      </div>
                    </td>
                    <td>${r.department || '-'}</td>
                    <td>${formatDate(r.date)}</td>
                    <td><strong style="color:var(--success)">${r.check_in || '-'}</strong></td>
                    <td><strong style="color:var(--danger)">${r.check_out || '-'}</strong></td>
                    <td>${timeDiff(r.check_in, r.check_out)}</td>
                    <td>${statusBadge(r.status)}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    window._attendanceData = records;

  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
}

function filterAttendance() {
  const dateVal = document.getElementById('attDateFilter').value;
  const statusVal = document.getElementById('attStatusFilter').value;
  const records = (window._attendanceData || []).filter(r => {
    const matchDate = !dateVal || r.date === dateVal;
    const matchStatus = !statusVal || r.status === statusVal;
    return matchDate && matchStatus;
  });

  document.getElementById('attendanceTableBody').innerHTML = records.length === 0
    ? `<tr><td colspan="7">${emptyState('🔍', 'Sonuç bulunamadı')}</td></tr>`
    : records.map(r => `
        <tr>
          <td><div class="user-cell">${makeAvatar(r.user_name, 'avatar-sm')}<span>${r.user_name}</span></div></td>
          <td>${r.department || '-'}</td>
          <td>${formatDate(r.date)}</td>
          <td><strong style="color:var(--success)">${r.check_in || '-'}</strong></td>
          <td><strong style="color:var(--danger)">${r.check_out || '-'}</strong></td>
          <td>${timeDiff(r.check_in, r.check_out)}</td>
          <td>${statusBadge(r.status)}</td>
        </tr>
      `).join('');
}

// ─── İzin Talepleri Sayfası ───────────────────────────────────────────────────
async function renderLeavesPage() {
  const content = document.getElementById('pageContent');

  try {
    const leaves = await API.getLeaves();

    content.innerHTML = `
      <div class="page-header">
        <h2>🏖️ İzin Talepleri</h2>
        <div style="display:flex; gap:8px">
          <select class="form-control" id="leaveStatusFilter" style="width:auto" onchange="filterLeaves()">
            <option value="">Tüm Durumlar</option>
            <option value="pending">Bekliyor</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
          </select>
        </div>
      </div>

      <div class="card" style="padding:0">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Personel</th>
                <th>Tür</th>
                <th>Başlangıç</th>
                <th>Bitiş</th>
                <th>Gün</th>
                <th>Açıklama</th>
                <th>Durum</th>
                <th style="text-align:center">İşlem</th>
              </tr>
            </thead>
            <tbody id="leavesTableBody">
              ${renderLeavesRows(leaves)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    window._leavesData = leaves;
    updatePendingLeaveBadge();

  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
}

// Sadece admin ve müdür izin onaylayabilir / reddedebilir
function canApproveLeaves() {
  const role = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.role : (getUser() || {}).role;
  return role === 'admin' || role === 'manager';
}

function renderLeavesRows(leaves) {
  if (leaves.length === 0) return `<tr><td colspan="8">${emptyState('🏖️', 'İzin talebi bulunamadı')}</td></tr>`;
  return leaves.map(l => `
    <tr id="leave-row-${l.id}">
      <td>
        <div class="user-cell">
          ${makeAvatar(l.user_name, 'avatar-sm')}
          <div>
            <div class="user-name">${l.user_name}</div>
            <div class="user-dept">${l.department || ''}</div>
          </div>
        </div>
      </td>
      <td>${leaveTypeBadge(l.type)}</td>
      <td>${formatDate(l.start_date)}</td>
      <td>${formatDate(l.end_date)}</td>
      <td><strong>${daysBetween(l.start_date, l.end_date)}</strong> gün</td>
      <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis">${l.reason || '-'}</td>
      <td>${statusBadge(l.status)}</td>
      <td style="text-align:center">
        ${l.status === 'pending' && canApproveLeaves() ? `
          <div style="display:flex; justify-content:center; gap:6px">
            <button class="btn btn-success btn-sm" onclick="quickApproveLeave(${l.id})" title="Onayla">✅ Onayla</button>
            <button class="btn btn-danger btn-sm" onclick="quickRejectLeave(${l.id})" title="Reddet">❌ Reddet</button>
          </div>
        ` : `<span style="color:var(--text-muted); font-size:0.8rem">—</span>`}
      </td>
    </tr>
  `).join('');
}

function filterLeaves() {
  const status = document.getElementById('leaveStatusFilter').value;
  const leaves = (window._leavesData || []).filter(l => !status || l.status === status);
  document.getElementById('leavesTableBody').innerHTML = renderLeavesRows(leaves);
}

async function quickApproveLeave(id) {
  try {
    await API.approveLeave(id);
    showToast('İzin onaylandı! ✅', 'success');
    renderLeavesPage();
  } catch (err) { showToast(err.message, 'error'); }
}

async function quickRejectLeave(id) {
  try {
    await API.rejectLeave(id);
    showToast('İzin reddedildi.', 'warning');
    renderLeavesPage();
  } catch (err) { showToast(err.message, 'error'); }
}

// ─── Duyurular Sayfası ────────────────────────────────────────────────────────
async function renderAnnouncementsPage() {
  const content = document.getElementById('pageContent');

  try {
    const announcements = await API.getAnnouncements();
    const canCreate = ['admin', 'manager'].includes(currentUser.role);

    content.innerHTML = `
      <div class="page-header">
        <h2>📢 Duyurular</h2>
        ${canCreate ? `<button class="btn btn-primary" onclick="openAnnouncementModal()">➕ Duyuru Oluştur</button>` : ''}
      </div>

      ${announcements.length === 0
        ? `<div class="card">${emptyState('📭', 'Henüz duyuru yok', 'İlk duyuruyu oluşturmak için butona tıklayın.')}</div>`
        : announcements.map(a => `
          <div class="announcement-item priority-${a.priority}" style="margin-bottom:12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:20px; border-left:4px solid ${a.priority === 'high' ? 'var(--danger)' : a.priority === 'low' ? 'var(--text-muted)' : 'var(--primary)'}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div style="flex:1">
                <div class="announcement-title" style="font-size:1rem; margin-bottom:8px">${a.title} ${a.priority === 'high' ? '<span class="badge badge-danger">🔴 Önemli</span>' : ''}</div>
                <div class="announcement-meta">
                  <span>👤 ${a.creator_name}</span>
                  <span>•</span>
                  <span>📅 ${formatDateTime(a.created_at)}</span>
                </div>
                <div class="announcement-content" style="margin-top:10px; line-height:1.6">${a.content}</div>
              </div>
              ${canCreate ? `
                <button class="btn btn-ghost btn-icon" onclick="deleteAnnouncement(${a.id})" title="Sil" style="margin-left:12px; color:var(--text-muted)">🗑️</button>
              ` : ''}
            </div>
          </div>
        `).join('')
      }
    `;
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
}

function openAnnouncementModal() {
  document.getElementById('announcementForm').reset();
  openModal('announcementModal');
}

async function saveAnnouncement() {
  const btn = document.getElementById('annFormSaveBtn');
  const originalText = btn.innerHTML;
  const body = {
    title:    document.getElementById('annTitle').value.trim(),
    content:  document.getElementById('annContent').value.trim(),
    priority: document.getElementById('annPriority').value,
  };

  if (!body.title || !body.content) {
    showToast('Başlık ve içerik zorunludur.', 'warning');
    return;
  }

  setButtonLoading(btn, true);
  try {
    await API.createAnnouncement(body);
    showToast('Duyuru yayınlandı! 📢', 'success');
    closeModal('announcementModal');
    renderAnnouncementsPage();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false, originalText);
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
  try {
    await API.deleteAnnouncement(id);
    showToast('Duyuru silindi.', 'success');
    renderAnnouncementsPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Raporlar Sayfası ─────────────────────────────────────────────────────────
async function renderReportsPage() {
  const content = document.getElementById('pageContent');

  try {
    const [users, records] = await Promise.all([
      API.getUsers(),
      API.getAttendance({ month: currentMonthISO() }),
    ]);

    const employees = users.filter(u => u.role === 'employee');

    // Her personel için istatistik hesapla
    const statsMap = {};
    records.forEach(r => {
      if (!statsMap[r.user_id]) {
        statsMap[r.user_id] = { present: 0, late: 0, absent: 0, name: r.user_name, dept: r.department };
      }
      statsMap[r.user_id][r.status] = (statsMap[r.user_id][r.status] || 0) + 1;
    });

    content.innerHTML = `
      <div class="page-header">
        <h2>📈 Aylık Devam Raporu</h2>
        <input type="month" class="form-control" id="reportMonth" value="${currentMonthISO()}" style="width:auto" onchange="renderReportsPage()">
      </div>

      <div class="card" style="padding:0">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Personel</th>
                <th>Departman</th>
                <th style="text-align:center">✅ Mevcut</th>
                <th style="text-align:center">⏰ Geç</th>
                <th style="text-align:center">❌ Devamsız</th>
                <th style="text-align:center">Toplam Gün</th>
                <th>Devam Oranı</th>
              </tr>
            </thead>
            <tbody>
              ${employees.map(u => {
                const s = statsMap[u.id] || { present: 0, late: 0, absent: 0 };
                const total = s.present + s.late + s.absent;
                const rate = total > 0 ? Math.round(((s.present + s.late) / total) * 100) : 0;
                const color = rate >= 90 ? 'var(--success)' : rate >= 75 ? 'var(--warning)' : 'var(--danger)';
                return `
                  <tr>
                    <td><div class="user-cell">${makeAvatar(u.name, 'avatar-sm')}<span>${u.name}</span></div></td>
                    <td>${u.department || '-'}</td>
                    <td style="text-align:center"><strong style="color:var(--success)">${s.present}</strong></td>
                    <td style="text-align:center"><strong style="color:var(--warning)">${s.late}</strong></td>
                    <td style="text-align:center"><strong style="color:var(--danger)">${s.absent}</strong></td>
                    <td style="text-align:center">${total}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:10px">
                        <div style="flex:1; height:6px; background:var(--bg-elevated); border-radius:3px; overflow:hidden">
                          <div style="height:100%; width:${rate}%; background:${color}; border-radius:3px; transition:width 0.5s"></div>
                        </div>
                        <span style="font-weight:700; color:${color}; min-width:36px">${rate}%</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = errorState(err.message);
  }
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
function buildProgressBar(label, value, total, color) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return `
    <div>
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px">
        <span style="color:var(--text-secondary)">${label}</span>
        <span style="font-weight:700; color:var(--text-primary)">${value} / ${total}</span>
      </div>
      <div style="height:6px; background:var(--bg-elevated); border-radius:3px; overflow:hidden">
        <div style="height:100%; width:${pct}%; background:${color}; border-radius:3px; transition:width 0.6s ease"></div>
      </div>
    </div>
  `;
}

function errorState(msg) {
  return `<div class="card">${emptyState('⚠️', 'Hata oluştu', msg)}</div>`;
}
