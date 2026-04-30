/**
 * public/js/api.js
 * -----------------
 * Backend API wrappers — all routes match TRD:
 *   GET /api/profiles          (with X-API-Version: 1 header)
 *   GET /api/profiles/search
 *   GET /api/profiles/export
 *   GET /api/users/me
 */

const API_HEADERS = { 'X-API-Version': '1' };

const ProfileAPI = {

  // GET /api/profiles
  getProfiles: async (params = {}) => {
    const qs  = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    );
    const res = await authFetch(`${API}/api/profiles?${qs}`, {
      headers: API_HEADERS,
    });
    if (!res) return null;
    return res.json();
  },

  // GET /api/profiles/search
  searchProfiles: async (q, params = {}) => {
    const qs  = new URLSearchParams({ q, ...params });
    const res = await authFetch(`${API}/api/profiles/search?${qs}`, {
      headers: API_HEADERS,
    });
    if (!res) return null;
    return res.json();
  },

  // GET /api/profiles/export?format=csv
  exportProfiles: async (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    );
    const res = await authFetch(`${API}/api/profiles/export?format=csv&${qs}`, {
      headers: API_HEADERS,
    });
    if (!res) return null;

    const count  = res.headers.get('X-Export-Count');
    const capped = res.headers.get('X-Export-Capped') === 'true';
    const blob   = await res.blob();

    return { blob, count, capped };
  },

  // GET /api/users/me
  getMe: async () => {
    const res = await authFetch(`${API}/api/users/me`, {
      headers: API_HEADERS,
    });
    if (!res) return null;
    return res.json();
  },
};

window.ProfileAPI = ProfileAPI;