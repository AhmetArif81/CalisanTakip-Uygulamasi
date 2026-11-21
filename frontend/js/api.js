/**
 * api.js — Backend ile iletişim kuran helper fonksiyonlar
 * Her fonksiyon: JWT token'ı header'a ekler ve JSON yanıt döner
 */

const API_BASE = '/api';

// ─── Token Yönetimi ───────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ─── Temel HTTP İstek Fonksiyonu ──────────────────────────────────────────────
async function apiRequest(method, endpoint, body = null) {
  const token = getToken();

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  // Token süresi dolmuşsa login'e yönlendir
  if (response.status === 401 || response.status === 403) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      clearSession();
      window.location.href = '/';
    }
    throw new Error(data.error || 'Yetki hatası');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Hata: ${response.status}`);
  }

  return data;
}

// ─── API Metodları ────────────────────────────────────────────────────────────
const API = {
  // Auth
  login:  (body) => apiRequest('POST', '/auth/login', body),
  getMe:  ()     => apiRequest('GET',  '/auth/me'),

  // Kullanıcılar
  getUsers:   ()           => apiRequest('GET',    '/users'),
  getUser:    (id)         => apiRequest('GET',    `/users/${id}`),
  createUser: (body)       => apiRequest('POST',   '/users', body),
  updateUser: (id, body)   => apiRequest('PUT',    `/users/${id}`, body),
  deleteUser: (id)         => apiRequest('DELETE', `/users/${id}`),

  // Devam
  getAttendance: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest('GET', `/attendance${q ? '?' + q : ''}`);
  },
  getTodaySummary: () => apiRequest('GET', '/attendance/today'),
  checkIn:         (body = {}) => apiRequest('POST', '/attendance/checkin', body),
  checkOut:        (body = {}) => apiRequest('POST', '/attendance/checkout', body),
  getStats:        (userId) => apiRequest('GET', `/attendance/stats/${userId}`),

  // İzinler
  getLeaves:     (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest('GET', `/leaves${q ? '?' + q : ''}`);
  },
  createLeave:   (body) => apiRequest('POST',   '/leaves', body),
  approveLeave:  (id)   => apiRequest('PUT',    `/leaves/${id}/approve`),
  rejectLeave:   (id)   => apiRequest('PUT',    `/leaves/${id}/reject`),
  deleteLeave:   (id)   => apiRequest('DELETE', `/leaves/${id}`),

  // Duyurular
  getAnnouncements:  ()       => apiRequest('GET',    '/announcements'),
  createAnnouncement:(body)   => apiRequest('POST',   '/announcements', body),
  deleteAnnouncement:(id)     => apiRequest('DELETE', `/announcements/${id}`),
};

// Global olarak kullanılabilir
window.API = API;
window.getUser = getUser;
window.saveSession = saveSession;
window.clearSession = clearSession;
