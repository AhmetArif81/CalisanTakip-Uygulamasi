/**
 * employee.js — Personel paneli render fonksiyonları
 */

// ─── Personel Dashboard ───────────────────────────────────────────────────────
async function renderEmployeeDashboard() {
  const content = document.getElementById('pageContent');

  try {
    const [todayAttendance, stats, leaves, announcements] = await Promise.all([
      API.getAttendance({ date: todayISO(), userId: currentUser.id }),
      API.getStats(currentUser.id),
      API.getLeaves(),
      API.getAnnouncements(),
    ]);

    const today = todayAttendance.find(r => r.user_id === currentUser.id && r.date === todayISO());

    content.innerHTML = `
      <div style="margin-bottom:24px">
        <h2 style="font-size:1.5rem; font-weight:800">
          Merhaba, ${currentUser.name.split(' ')[0]}! 
          ${getGreetingEmoji()}
        </h2>
        <p style="color:var(--text-muted); margin-top:4px">
          ${new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      <!-- Bugün Durumu -->
      <div class="checkin-card" style="margin-bottom:24px">
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.1em; font-weight:600">Bugünün Durumu</div>
        <div class="checkin-time-display" id="liveClockEmployee">--:--:--</div>
        <div class="checkin-date">${new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })}</div>

        <div class="checkin-status-row">
          <div class="checkin-status-item">
            <div class="checkin-status-label">İş Giriş Saati</div>
            <div class="checkin-status-value" id="todayCheckIn" style="color:var(--success)">${today?.check_in || '09:00'}</div>
          </div>
          <div style="width:1px; height:40px; background:var(--border); align-self:center"></div>
          <div class="checkin-status-item">
            <div class="checkin-status-label">İş Çıkış Saati</div>
            <div class="checkin-status-value" id="todayCheckOut" style="color:var(--danger)">${today?.check_out || '17:00'}</div>
          </div>
          <div style="width:1px; height:40px; background:var(--border); align-self:center"></div>
          <div class="checkin-status-item">
            <div class="checkin-status-label">Mesai Süresi</div>
            <div class="checkin-status-value">${today?.check_in && today?.check_out ? timeDiff(today.check_in, today.check_out) : '8 saat'}</div>
          </div>
        </div>

        <div class="checkin-actions">
          <button class="btn btn-success" id="checkInBtn" onclick="doCheckIn()" 
            ${today?.check_in ? 'disabled' : ''}>
            🟢 ${today?.check_in ? 'Giriş Yapıldı (09:00)' : 'Giriş Yap (09:00)'}
          </button>
          <button class="btn btn-danger" id="checkOutBtn" onclick="doCheckOut()"
            ${!today?.check_in || today?.check_out ? 'disabled' : ''}>
            🔴 ${today?.check_out ? 'Çıkış Yapıldı (17:00)' : 'Çıkış Yap (17:00)'}
          </button>
        </div>

        ${today ? `<div style="margin-top:12px">${statusBadge(today.status)}</div>` : ''}
      </div>

      <!-- İstatistikler -->
      <div class="stats-grid" style="margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15)">✅</div>
          <div class="stat-info">
            <div class="stat-label">Mevcut Günler</div>
            <div class="stat-value">${stats.present_days || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15)">⏰</div>
          <div class="stat-info">
            <div class="stat-label">Geç Gelme</div>
            <div class="stat-value">${stats.late_days || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15)">❌</div>
          <div class="stat-info">
            <div class="stat-label">Devamsız</div>
            <div class="stat-value">${stats.absent_days || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.15)">📅</div>
          <div class="stat-info">
            <div class="stat-label">Toplam Kayıt</div>
            <div class="stat-value">${stats.total_days || 0}</div>
          </div>
        </div>
      </div>

      <!-- İzinlerim & Duyurular -->
      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🏖️ İzin Taleplerim</h3>
            <button class="btn btn-primary btn-sm" onclick="openLeaveModal()">➕ Yeni Talep</button>
          </div>
          ${leaves.length === 0
            ? emptyState('🌴', 'İzin talebiniz yok')
            : leaves.slice(0, 4).map(l => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border)">
                <div>
                  <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary)">
                    ${formatDate(l.start_date)} — ${formatDate(l.end_date)}
                    <span style="margin-left:6px">${leaveTypeBadge(l.type)}</span>
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px">${daysBetween(l.start_date, l.end_date)} gün • ${l.reason || 'Açıklama yok'}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px">
                  ${statusBadge(l.status)}
                  ${l.status === 'pending' ? `<button class="btn btn-ghost btn-icon btn-sm" onclick="cancelLeave(${l.id})" title="İptal">✕</button>` : ''}
                </div>
              </div>
            `).join('')
          }
          ${leaves.length > 0 ? `<button class="btn btn-ghost btn-sm" style="margin-top:8px; width:100%" onclick="navigate('leaves')">Tümünü Gör →</button>` : ''}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📢 Duyurular</h3>
          </div>
          ${announcements.length === 0
            ? emptyState('📭', 'Duyuru yok')
            : announcements.slice(0, 3).map(a => `
              <div class="announcement-item priority-${a.priority}" style="margin-bottom:8px">
                <div class="announcement-title">${a.title} ${a.priority === 'high' ? '🔴' : ''}</div>
                <div class="announcement-meta">
                  <span>📅 ${formatDateTime(a.created_at)}</span>
                </div>
                <div class="announcement-content">${a.content.length > 80 ? a.content.slice(0, 80) + '...' : a.content}</div>
              </div>
            `).join('')
          }
          ${announcements.length > 3 ? `<button class="btn btn-ghost btn-sm" style="margin-top:4px; width:100%" onclick="navigate('announcements')">Tümünü Gör →</button>` : ''}
        </div>
      </div>
    `;

    // Canlı saat
    startEmployeeClock();

  } catch (err) {
    content.innerHTML = `<div class="card">${emptyState('⚠️', 'Yükleme hatası', err.message)}</div>`;
  }
}

// ─── Giriş/Çıkış Sayfası ──────────────────────────────────────────────────────
async function renderCheckinPage() {
  const content = document.getElementById('pageContent');

  try {
    const [records, stats] = await Promise.all([
      API.getAttendance(),
      API.getStats(currentUser.id),
    ]);

    const today = records.find(r => r.date === todayISO());

    content.innerHTML = `
      <!-- Check-in Kartı -->
      <div class="checkin-card" style="max-width:500px; margin:0 auto 28px">
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.1em; font-weight:600">Anlık Saat</div>
        <div class="checkin-time-display" id="liveClockEmployee2">--:--:--</div>
        <div class="checkin-date">${new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>

        <div class="checkin-status-row">
          <div class="checkin-status-item">
            <div class="checkin-status-label">İş Giriş Saati</div>
            <div class="checkin-status-value" id="pageCheckIn" style="color:var(--success); font-size:1.2rem">${today?.check_in || '09:00'}</div>
          </div>
          <div style="width:1px; height:40px; background:var(--border); align-self:center"></div>
          <div class="checkin-status-item">
            <div class="checkin-status-label">İş Çıkış Saati</div>
            <div class="checkin-status-value" id="pageCheckOut" style="color:var(--danger); font-size:1.2rem">${today?.check_out || '17:00'}</div>
          </div>
        </div>

        ${today?.check_in && today?.check_out
          ? `<div style="margin-bottom:16px; padding:12px; background:rgba(16,185,129,0.1); border-radius:var(--radius-sm); color:var(--success); font-weight:600">
              ✅ Bugünkü çalışma süresi: <strong>${timeDiff(today.check_in, today.check_out)}</strong>
             </div>`
          : `<div style="margin-bottom:16px; padding:10px 14px; background:var(--bg-elevated); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:0.85rem">
              🏢 Standart Mesai Saatleri: <strong>09:00 - 17:00</strong>
             </div>`
        }

        <div class="checkin-actions">
          <button class="btn btn-success btn-lg" id="checkInBtn" onclick="doCheckIn()"
            ${today?.check_in ? 'disabled' : ''} style="min-width:160px">
            🟢 ${today?.check_in ? '✓ Giriş Yapıldı (09:00)' : 'Giriş Yap (09:00)'}
          </button>
          <button class="btn btn-danger btn-lg" id="checkOutBtn" onclick="doCheckOut()"
            ${!today?.check_in || today?.check_out ? 'disabled' : ''} style="min-width:160px">
            🔴 ${today?.check_out ? '✓ Çıkış Yapıldı (17:00)' : 'Çıkış Yap (17:00)'}
          </button>
        </div>
      </div>

      <!-- Bu Ay Kayıtlar -->
      <div class="card" style="padding:0">
        <div class="card-header" style="padding:16px 20px">
          <h3 class="card-title">📋 Bu Ayki Kayıtlarım</h3>
          <span class="badge badge-primary">${stats.total_days || 0} kayıt</span>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Giriş</th>
                <th>Çıkış</th>
                <th>Çalışma Süresi</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              ${records.length === 0
                ? `<tr><td colspan="5">${emptyState('📋', 'Kayıt bulunamadı')}</td></tr>`
                : records.slice(0, 20).map(r => `
                  <tr>
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

    startEmployeeClock('liveClockEmployee2');

  } catch (err) {
    content.innerHTML = `<div class="card">${emptyState('⚠️', 'Yükleme hatası', err.message)}</div>`;
  }
}

// ─── Giriş/Çıkış Fonksiyonları ────────────────────────────────────────────────
async function doCheckIn() {
  const btn = document.getElementById('checkInBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';

  try {
    const result = await API.checkIn({ time: '09:00' });
    showToast(`Giriş kaydedildi: ${result.record.check_in || '09:00'} ✅`, 'success');

    // Saatleri güncelle
    const checkInEl = document.getElementById('todayCheckIn') || document.getElementById('pageCheckIn');
    if (checkInEl) checkInEl.textContent = result.record.check_in || '09:00';
    btn.innerHTML = `🟢 ✓ Giriş Yapıldı (09:00)`;

    const outBtn = document.getElementById('checkOutBtn');
    if (outBtn) outBtn.disabled = false;

  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '🟢 Giriş Yap (09:00)';
  }
}

async function doCheckOut() {
  const btn = document.getElementById('checkOutBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';

  try {
    const result = await API.checkOut({ time: '17:00' });
    showToast(`Çıkış kaydedildi: ${result.record.check_out || '17:00'} ✅`, 'success');

    const checkOutEl = document.getElementById('todayCheckOut') || document.getElementById('pageCheckOut');
    if (checkOutEl) checkOutEl.textContent = result.record.check_out || '17:00';
    btn.innerHTML = `🔴 ✓ Çıkış Yapıldı (17:00)`;

  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '🔴 Çıkış Yap (17:00)';
  }
}

// ─── İzin Modal & Fonksiyonları ────────────────────────────────────────────────
function openLeaveModal() {
  document.getElementById('leaveForm').reset();
  // Minimum tarih bugün
  document.getElementById('leaveStart').min = todayISO();
  document.getElementById('leaveEnd').min = todayISO();
  openModal('leaveModal');
}

async function submitLeave() {
  const btn = document.getElementById('leaveFormSaveBtn');
  const originalText = btn.innerHTML;
  const body = {
    start_date: document.getElementById('leaveStart').value,
    end_date:   document.getElementById('leaveEnd').value,
    type:       document.getElementById('leaveType').value,
    reason:     document.getElementById('leaveReason').value.trim(),
  };

  if (!body.start_date || !body.end_date) {
    showToast('Başlangıç ve bitiş tarihi zorunludur.', 'warning');
    return;
  }

  setButtonLoading(btn, true);
  try {
    await API.createLeave(body);
    showToast('İzin talebiniz gönderildi! ✅', 'success');
    closeModal('leaveModal');
    renderEmployeeDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false, originalText);
  }
}

async function cancelLeave(id) {
  if (!confirm('Bu izin talebini iptal etmek istiyor musunuz?')) return;
  try {
    await API.deleteLeave(id);
    showToast('İzin talebi iptal edildi.', 'success');
    navigate('dashboard');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Canlı Saat ───────────────────────────────────────────────────────────────
let _clockInterval = null;

function startEmployeeClock(elId = 'liveClockEmployee') {
  if (_clockInterval) clearInterval(_clockInterval);
  function tick() {
    const el = document.getElementById(elId);
    if (!el) { clearInterval(_clockInterval); return; }
    el.textContent = new Date().toLocaleTimeString('tr-TR');
  }
  tick();
  _clockInterval = setInterval(tick, 1000);
}

// ─── Selamlama ────────────────────────────────────────────────────────────────
function getGreetingEmoji() {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 18) return '🌤️';
  return '🌙';
}
