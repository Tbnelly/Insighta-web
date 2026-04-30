/**
 * public/js/profiles.js
 * ----------------------
 * Dashboard logic — updated to use total_pages (TRD format)
 * instead of totalPages.
 */

let state = {
  page:     1,
  limit:    10,
  filters:  {},
  searchQ:  '',
  isSearch: false,
};

const els = {
  loading:     document.getElementById('loadingState'),
  errorState:  document.getElementById('errorState'),
  errorMsg:    document.getElementById('errorMsg'),
  tableWrap:   document.getElementById('tableWrap'),
  tbody:       document.getElementById('profilesBody'),
  pagination:  document.getElementById('pagination'),
  statTotal:   document.getElementById('statTotal'),
  statPage:    document.getElementById('statPage'),
  statPages:   document.getElementById('statPages'),
  pageInfo:    document.getElementById('pageInfo'),
  prevBtn:     document.getElementById('prevBtn'),
  nextBtn:     document.getElementById('nextBtn'),
  navUsername: document.getElementById('navUsername'),
  roleBadge:   document.getElementById('roleBadge'),
  nlSearch:    document.getElementById('nlSearch'),
  nlSearchBtn: document.getElementById('nlSearchBtn'),
  clearSearch: document.getElementById('clearSearchBtn'),
  applyFilter: document.getElementById('applyFiltersBtn'),
  clearFilter: document.getElementById('clearFiltersBtn'),
  exportBtn:   document.getElementById('exportBtn'),
  exportNote:  document.getElementById('exportNote'),
  gender:      document.getElementById('filterGender'),
  ageGroup:    document.getElementById('filterAgeGroup'),
  country:     document.getElementById('filterCountry'),
  minAge:      document.getElementById('filterMinAge'),
  maxAge:      document.getElementById('filterMaxAge'),
  sortBy:      document.getElementById('filterSortBy'),
  order:       document.getElementById('filterOrder'),
};

const showLoading = () => {
  els.loading.style.display    = 'flex';
  els.tableWrap.style.display  = 'none';
  els.errorState.style.display = 'none';
  els.pagination.style.display = 'none';
};

const showError = (msg) => {
  els.loading.style.display    = 'none';
  els.tableWrap.style.display  = 'none';
  els.errorState.style.display = 'block';
  els.pagination.style.display = 'none';
  els.errorMsg.textContent     = msg;
};

const showTable = () => {
  els.loading.style.display    = 'none';
  els.tableWrap.style.display  = 'block';
  els.errorState.style.display = 'none';
  els.pagination.style.display = 'flex';
};

// TRD response uses total_pages not totalPages
const renderStats = (result) => {
  const totalPages = result.total_pages || result.totalPages || 1;
  els.statTotal.textContent = result.total.toLocaleString();
  els.statPage.textContent  = result.page;
  els.statPages.textContent = totalPages;
  els.pageInfo.textContent  = `Page ${result.page} of ${totalPages}`;
  els.prevBtn.disabled      = result.page <= 1;
  els.nextBtn.disabled      = result.page >= totalPages;
};

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );

const renderRow = (p) => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${escapeHtml(p.name)}</td>
    <td class="gender-${p.gender}">${p.gender}</td>
    <td>${p.age}</td>
    <td>${p.age_group}</td>
    <td>${escapeHtml(p.country_name)} <span style="color:var(--text-muted)">(${p.country_id})</span></td>
    <td>${p.gender_probability}</td>
    <td>${p.country_probability}</td>
  `;
  return tr;
};

const loadProfiles = async () => {
  showLoading();

  try {
    let result;

    if (state.isSearch && state.searchQ) {
      result = await ProfileAPI.searchProfiles(state.searchQ, {
        page: state.page, limit: state.limit,
      });
    } else {
      result = await ProfileAPI.getProfiles({
        ...state.filters,
        page:  state.page,
        limit: state.limit,
      });
    }

    if (!result || result.status !== 'success') {
      showError(result?.message || 'Failed to load profiles.');
      return;
    }

    els.tbody.innerHTML = '';
    if (result.data.length === 0) {
      els.tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px">No profiles found.</td></tr>`;
    } else {
      result.data.forEach((p) => els.tbody.appendChild(renderRow(p)));
    }

    // Pass the full result object — renderStats reads total_pages directly
    renderStats(result);
    showTable();

  } catch (err) {
    showError(err.message || 'Unexpected error.');
  }
};

// Pagination
els.prevBtn.addEventListener('click', () => {
  if (state.page > 1) { state.page--; loadProfiles(); }
});
els.nextBtn.addEventListener('click', () => {
  state.page++;
  loadProfiles();
});

// Apply filters
els.applyFilter.addEventListener('click', () => {
  state.isSearch = false;
  state.searchQ  = '';
  state.page     = 1;
  state.filters  = {
    gender:     els.gender.value,
    age_group:  els.ageGroup.value,
    country_id: els.country.value.toUpperCase(),
    min_age:    els.minAge.value,
    max_age:    els.maxAge.value,
    sort_by:    els.sortBy.value,
    order:      els.order.value,
  };
  loadProfiles();
});

// Clear filters
els.clearFilter.addEventListener('click', () => {
  els.gender.value   = '';
  els.ageGroup.value = '';
  els.country.value  = '';
  els.minAge.value   = '';
  els.maxAge.value   = '';
  els.sortBy.value   = '';
  els.order.value    = 'asc';
  state.filters  = {};
  state.page     = 1;
  state.isSearch = false;
  loadProfiles();
});

// NL Search
const runSearch = () => {
  const q = els.nlSearch.value.trim();
  if (!q) return;
  state.searchQ  = q;
  state.isSearch = true;
  state.page     = 1;
  loadProfiles();
};

els.nlSearchBtn.addEventListener('click', runSearch);
els.nlSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });

// Clear search
els.clearSearch.addEventListener('click', () => {
  els.nlSearch.value = '';
  state.searchQ  = '';
  state.isSearch = false;
  state.page     = 1;
  loadProfiles();
});

// Retry
document.getElementById('retryBtn').addEventListener('click', loadProfiles);

// Export CSV
els.exportBtn.addEventListener('click', async () => {
  els.exportBtn.disabled    = true;
  els.exportBtn.textContent = '⏳ Exporting...';
  els.exportNote.textContent = '';

  try {
    const params = state.isSearch ? {} : state.filters;
    const result = await ProfileAPI.exportProfiles(params);
    if (!result) return;

    const url  = URL.createObjectURL(result.blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href     = url;
    a.download = `insighta-export-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    els.exportNote.textContent = `✓ Exported ${result.count} records`;
    if (result.capped) els.exportNote.textContent += ' (capped at 10,000)';

  } catch (err) {
    els.exportNote.textContent = '✗ Export failed: ' + err.message;
  } finally {
    els.exportBtn.disabled    = false;
    els.exportBtn.textContent = '⬇ Export CSV';
  }
});

// Load user info into navbar
(async () => {
  const result = await ProfileAPI.getMe();
  if (result?.data) {
    els.navUsername.textContent = result.data.username;
    els.roleBadge.textContent   = result.data.role;
    els.roleBadge.className     = `role-badge ${result.data.role}`;
  }
})();

// Initial load
loadProfiles();