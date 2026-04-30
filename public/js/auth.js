/**
 * public/js/auth.js
 * ------------------
 * Handles all authentication concerns in the browser.
 * Routes match TRD:
 *   /auth/github    /auth/logout    /auth/refresh
 */

const API = CONFIG.API;

const Auth = {
  getToken:   ()      => sessionStorage.getItem('accessToken'),
  setToken:   (token) => sessionStorage.setItem('accessToken', token),
  clearToken: ()      => sessionStorage.removeItem('accessToken'),
  isLoggedIn: ()      => !!sessionStorage.getItem('accessToken'),
};

// Login button
const loginBtn = document.getElementById('githubLoginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = `${API}/auth/github`;
  });
}

// Auth guard
const isAuthPage    = window.location.pathname.includes('login');
const isSuccessPage = window.location.pathname.includes('auth/success');

if (!isAuthPage && !isSuccessPage && !Auth.isLoggedIn()) {
  window.location.href = '/login.html';
}

// Logout button
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await authFetch(`${API}/auth/logout`, { method: 'POST' });
    } catch { /* clear locally regardless */ }
    Auth.clearToken();
    window.location.href = '/login.html';
  });
}

// authFetch — attaches token + auto-refreshes on 401
async function authFetch(url, options = {}) {
  const token = Auth.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  let response = await fetch(url, { ...options, headers, credentials: 'include' });

  if (response.status === 401) {
    const body = await response.clone().json().catch(() => ({}));

    if (body.code === 'TOKEN_EXPIRED') {
      const refreshed = await tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        response = await fetch(url, { ...options, headers, credentials: 'include' });
      } else {
        Auth.clearToken();
        window.location.href = '/login.html';
        return;
      }
    } else {
      Auth.clearToken();
      window.location.href = '/login.html';
      return;
    }
  }

  return response;
}

// tryRefresh — uses HTTP-only cookie automatically
async function tryRefresh() {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return false;

    const data  = await res.json();
    const token = data.access_token || data.accessToken;
    if (token) {
      Auth.setToken(token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

window.Auth      = Auth;
window.authFetch = authFetch;
window.API       = API;