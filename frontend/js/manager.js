/**
 * manager.js — Müdür paneli render fonksiyonları
 */

// ─── Müdür Dashboard ──────────────────────────────────────────────────────────
async function renderManagerDashboard() {
  const content = document.getElementById('pageContent');

  try {
    const [summary, users, pendingLeaves, announcements] = await Promise.all([
      API.getTodaySummary(),
      API.getUsers(),
      API.getLeaves({ status: 'pending' }),
      API.getAnnouncements(),
    ]);

    const employees = users.filter(u => u.role === 'employee');

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
          <div class="stat-icon" style="background:rgba(239,68,68,0.15)">❌</div>
          <div class="stat-info">
            <div class="stat-label">Devamsız</div>
            <div class="stat-value">${summary.absent}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15)">⏳</div>
          <div class="stat-info">
            <div class="stat-label">Bekleyen İzin</div>
            <div class="stat-value">${pendingLeaves.length}</div>
          </div>
        </div>
      </div>

      <!-- İzin Bekleyenler & Duyurular -->
      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">⏳ Onay Bekleyen İzinler ${pendingLeaves.length > 0 ? `<span class="badge badge-danger">${pendingLeaves.length}</span>` : ''}</h3>
            <button class="btn btn-outline btn-sm" onclick="navigate('leaves')">Tümünü Gör</button>
          </div>

          ${pendingLeaves.length === 0
            ? emptyState('🎉', 'Bekleyen talep yok')
            : pendingLeaves.slice(0, 6).map(l => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border)">
                <div style="display:flex; align-items:center; gap:10px; flex:1">
                  ${makeAvatar(l.user_name, 'avatar-sm')}
                  <div>
                    <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary)">${l.user_name}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted)">
                      ${formatDate(l.start_date)} — ${formatDate(l.end_date)} 
                      <span style="margin-left:4px">${leaveTypeBadge(l.type)}</span>
                    </div>
                  </div>
                </div>
                <div style="display:flex; gap:6px; flex-shrink:0">
                  <button class="btn btn-success btn-sm" onclick="quickApproveLeave(${l.id})">✅ Onayla</button>
                  <button class="btn btn-danger btn-sm" onclick="quickRejectLeave(${l.id})">❌</button>
                </div>
              </div>
            `).join('')
          }
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📢 Son Duyurular</h3>
            <button class="btn btn-primary btn-sm" onclick="navigate('announcements');setTimeout(()=>openAnnouncementModal(),100)">➕ Yeni</button>
          </div>
          ${announcements.length === 0
            ? emptyState('📭', 'Henüz duyuru yok')
            : announcements.slice(0, 4).map(a => `
              <div class="announcement-item priority-${a.priority}" style="margin-bottom:8px">
                <div class="announcement-title">${a.title}</div>
                <div class="announcement-meta">
                  <span>👤 ${a.creator_name}</span> • <span>${formatDateTime(a.created_at)}</span>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>

      <!-- Personel Durumu -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">👥 Personel Durumu — Bugün</h3>
          <span class="badge badge-info">${new Date().toLocaleDateString('tr-TR')}</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px">
          ${buildPersonnelStatusCards(summary, employees.length)}
        </div>
      </div>
    `;

  } catch (err) {
    content.innerHTML = `<div class="card">${emptyState('⚠️', 'Veri yüklenemedi', err.message)}</div>`;
  }
}

function buildPersonnelStatusCards(summary, total) {
  const items = [
    { label: 'Mevcut', value: summary.present, color: '#10b981', icon: '✅' },
    { label: 'Geç Gelen', value: summary.late, color: '#f59e0b', icon: '⏰' },
    { label: 'İzinde', value: summary.on_leave, color: '#06b6d4', icon: '🏖️' },
    { label: 'Devamsız', value: summary.absent, color: '#ef4444', icon: '❌' },
  ];

  return items.map(item => `
    <div style="background:var(--bg-elevated); border-radius:var(--radius-sm); padding:16px; text-align:center; border:1px solid var(--border)">
      <div style="font-size:1.5rem; margin-bottom:6px">${item.icon}</div>
      <div style="font-size:1.8rem; font-weight:800; color:${item.color}">${item.value}</div>
      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px">${item.label}</div>
    </div>
  `).join('');
}
