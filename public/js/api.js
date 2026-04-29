/**
 * public/js/api.js
 * -----------------
 * Thin wrappers around backend API endpoints.
 * All calls go through authFetch so token refresh is automatic.
 */

const ProfileAPI = {

  /**
   * Fetch profiles with filters, sort, pagination.
   */
  getProfiles: async (params = {}) => {
    const qs  = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    );
    const res  = await authFetch(`${API}/api/v1/profiles?${qs}`);
    if (!res) return null;
    return res.json();
  },

  /**
   * Natural language search.
   */
  searchProfiles: async (q, params = {}) => {
    const qs  = new URLSearchParams({ q, ...params });
    const res  = await authFetch(`${API}/api/v1/profiles/search?${qs}`);
    if (!res) return null;
    return res.json();
  },

  /**
   * Export profiles as CSV — returns a Blob.
   */
  exportProfiles: async (params = {}) => {
    const qs  = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    );
    const res  = await authFetch(`${API}/api/v1/export/profiles?${qs}`);
    if (!res) return null;

    const count  = res.headers.get('X-Export-Count');
    const capped = res.headers.get('X-Export-Capped') === 'true';
    const blob   = await res.blob();

    return { blob, count, capped };
  },

  /**
   * Get the current logged-in user's profile.
   */
  getMe: async () => {
    const res = await authFetch(`${API}/api/v1/auth/me`);
    if (!res) return null;
    return res.json();
  },
};

window.ProfileAPI = ProfileAPI;
