# Insighta Web Portal

Browser-based interface for the Insighta Labs profile query engine. Login with GitHub, query profiles, apply filters, search with natural language, and export data as CSV.

## Live URL
```
https://insighta-web-three.vercel.app
```

## Tech Stack
- Pure HTML, CSS, JavaScript (no framework)
- Served by a minimal Express static file server
- Deployed on Vercel

---

## Features
- GitHub OAuth login
- Profile dashboard with pagination
- Sidebar filters (gender, age group, country, age range, sort)
- Natural language search
- CSV export with browser download
- Auto token refresh (silent, no interruption)
- Responsive GitHub dark theme

---

## Project Structure

```
public/
├── index.html          ← Main dashboard
├── login.html          ← Login page
├── auth/
│   └── success.html    ← Token capture after OAuth redirect
├── js/
│   ├── config.js       ← API URL configuration (dev vs prod)
│   ├── auth.js         ← Token storage, authFetch, login/logout
│   ├── api.js          ← Backend API wrappers
│   └── profiles.js     ← Dashboard logic
└── css/
    └── main.css        ← GitHub dark theme styles
server.js               ← Express static file server
```

---

## How Authentication Works

```
1. User clicks "Continue with GitHub"
2. Browser → GET /api/v1/auth/github (backend)
3. Backend redirects to GitHub consent screen
4. User approves
5. GitHub → backend callback URL
6. Backend issues tokens, sets refresh token as HTTP-only cookie
7. Backend redirects to /auth/success.html#token=eyJ...
8. success.html reads token from URL fragment (#)
   (fragment never hits server logs — security feature)
9. Token saved to sessionStorage
10. Redirects to dashboard — profiles load immediately
```

### Token Storage
| Token | Storage | Why |
|---|---|---|
| Access token (15 min) | `sessionStorage` | Cleared when tab closes, not accessible cross-tab |
| Refresh token (7 days) | HTTP-only cookie | JavaScript cannot read it — XSS protection |

### Auto Token Refresh
Every API call goes through `authFetch()` — a wrapper around `fetch()` that:
1. Attaches the access token automatically
2. On `401 TOKEN_EXPIRED` — silently calls `/auth/refresh` (sends cookie automatically)
3. Saves the new access token
4. Retries the original request

Users never see an interruption or login prompt during normal usage.

---

## Running Locally

```bash
npm install
node server.js
# Open http://localhost:3000
```

Make sure `public/js/config.js` has the correct local backend URL:
```js
const CONFIG = {
  API: window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://insighta-query-engine.vercel.app'
};
```

---

## Deployment

Deployed on Vercel as a static site served by Express.

After deploying, update `CLIENT_URL` on your backend Vercel project to match this portal's URL — this is required for CORS and the OAuth redirect to work correctly.

---

## Pages

### Login (`/login.html`)
- GitHub OAuth button
- Redirects to backend which handles the full OAuth flow

### Dashboard (`/index.html`)
- **Navbar** — username, role badge, logout button
- **Sidebar** — filter controls (gender, age group, country, min/max age, sort)
- **Search bar** — natural language search input
- **Stats row** — total records, current page, total pages
- **Profiles table** — paginated results with prev/next navigation
- **Export button** — downloads filtered results as CSV

### Auth Success (`/auth/success.html`)
- Intermediate page that captures the access token from the URL fragment
- Saves to sessionStorage and redirects to dashboard
- Users see this for less than a second