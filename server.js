'use strict';

/**
 * server.js
 * ---------
 * Minimal Express server that serves the static web portal.
 * The portal itself is pure HTML/CSS/JS — this server just
 * delivers the files to the browser. All API calls go directly
 * from the browser to the backend on port 5000.
 *
 * Why a server instead of just opening the HTML file?
 * Browsers block certain features (cookies, fetch to other origins)
 * when files are opened via file:// protocol. Running on a real
 * http://localhost:3000 URL avoids all of those restrictions.
 */

require('dotenv').config();

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve everything in /public as static files
app.use(express.static(path.join(__dirname, 'public')));

// Any unknown route → serve index.html (SPA-style fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[insighta-web] Portal running at http://localhost:${PORT}`);
});
