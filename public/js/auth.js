/**
 * public/js/auth.js
 * ------------------
 * Handles all authentication concerns in the browser:
 *  - Redirecting to GitHub login
 *  - Storing/reading the access token from sessionStorage
 *  - Auto-refreshing the token when it expires
 *  - Guarding pages that require authentication
 *  - Logout
 *
 * Token storage decision:
 *   sessionStorage — cleared when the tab closes. Appropriate for
 *   a short-lived access token (15 min). NOT localStorage — that
 *   persists forever and is accessible to any JS on the page.
 *
 * The refresh token is stored in an HTTP-only cookie by the backend.
 * JS cannot read it — that's the security. The backend reads it
 * automatically on every /auth/refresh call.
 */

const API = CONFIG.API;

// ── Token helpers ─────────────────────────────────────────────────────────────

const Auth = {
  getToken:   ()      => sessionStorage.getItem('accessToken'),
  setToken:   (token) => sessionStorage.setItem('accessToken', token),
  clearToken: ()      => sessionStorage.removeItem('accessToken'),
  isLoggedIn: ()      => !!sessionStorage.getItem('accessToken'),
};

// ── Login redirect ────────────────────────────────────────────────────────────

const loginBtn = document.getElementById('githubLoginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Redirect to backend — backend redirects to GitHub
    window.location.href = `${API}/api/v1/auth/github`;
  });
}

// ── Auth guard — redirect to login if no token ────────────────────────────────
// Only runs on pages that are NOT the login or auth/success page

const isAuthPage    = window.location.pathname.includes('login');
const isSuccessPage = window.location.pathname.includes('auth/success');

if (!isAuthPage && !isSuccessPage && !Auth.isLoggedIn()) {
  window.location.href = '/login.html';
}

// ── Logout button ─────────────────────────────────────────────────────────────

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await authFetch(`${API}/api/v1/auth/logout`, { method: 'POST' });
    } catch { /* ignore errors — clear locally regardless */ }
    Auth.clearToken();
    window.location.href = '/login.html';
  });
}

// ── authFetch — auto-refreshes token on 401 ───────────────────────────────────

/**
 * Drop-in replacement for fetch() that:
 *  1. Attaches the access token to every request
 *  2. On 401 TOKEN_EXPIRED — silently refreshes and retries once
 *  3. On any other 401 — redirects to login
 */
async function authFetch(url, options = {}) {
  const token = Auth.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  let response = await fetch(url, { ...options, headers, credentials: 'include' });

  // Try to refresh once on expired token
  if (response.status === 401) {
    const body = await response.clone().json().catch(() => ({}));

    if (body.code === 'TOKEN_EXPIRED') {
      const refreshed = await tryRefresh();
      if (refreshed) {
        // Retry original request with new token
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

/**
 * Call /auth/refresh — the backend reads the HTTP-only refresh token
 * cookie automatically. Returns true if successful.
 */
async function tryRefresh() {
  try {
    const res  = await fetch(`${API}/api/v1/auth/refresh`, {
      method:      'POST',
      credentials: 'include', // send the refresh token cookie
      headers:     { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.accessToken) {
      Auth.setToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Export for use in other scripts
window.Auth      = Auth;
window.authFetch = authFetch;
window.API       = API;
