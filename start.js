#!/usr/bin/env node
/**
 * Summarizer — Desktop File Organizer
 * Launches the EventMath API server + static UI on a single port.
 * 
 * API:     GET  /api/groups       — scan desktop, return grouped files
 *          POST /api/delete       — delete single file { path }
 *          POST /api/delete-group — delete group { paths: [...] }
 * UI:      GET  /                — web interface
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3003;
const SCANNER = path.join(__dirname, 'scanner.js');
const INDEX_HTML = path.join(__dirname, 'index.html');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function html(res, content, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(content);
}

function err(res, msg, status = 500) {
  json(res, { ok: false, error: msg }, status);
}

async function handleAPI(method, _path, req, res) {
  // GET /api/groups — scan desktop
  if (method === 'GET' && _path === '/api/groups') {
    try {
      const { spawn } = require('child_process');
      const child = spawn('node', [SCANNER], { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      child.stdout.on('data', d => stdout += d);
      child.stderr.on('data', d => stderr += d);
      await new Promise(r => child.on('close', r));

      if (child.exitCode !== 0) {
        return err(res, `Scanner failed: ${stderr.trim()}`);
      }
      json(res, JSON.parse(stdout));
    } catch (e) {
      err(res, e.message);
    }
    return true;
  }

  // POST /api/delete — delete a single file
  if (method === 'POST' && _path === '/api/delete') {
    const body = await readBody(req);
    const filePath = body.path;
    if (!filePath) return err(res, 'Missing path', 400);
    try {
      fs.unlinkSync(filePath);
      json(res, { ok: true, deleted: filePath });
    } catch (e) {
      err(res, `Cannot delete: ${e.message}`);
    }
    return true;
  }

  // GET /api/health
  if (method === 'GET' && _path === '/api/health') {
    json(res, { ok: true, version: '1.0', status: 'running' });
    return true;
  }

  // POST /api/delete-group — delete multiple files
  if (method === 'POST' && _path === '/api/delete-group') {
    const body = await readBody(req);
    const paths = body.paths || [];
    if (!paths.length) return err(res, 'Missing paths', 400);
    const results = [];
    for (const p of paths) {
      try {
        fs.unlinkSync(p);
        results.push({ path: p, ok: true });
      } catch (e) {
        results.push({ path: p, ok: false, error: e.message });
      }
    }
    json(res, { ok: true, deleted: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results });
    return true;
  }

  return false;
}

// ── Server ──
http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  const _path = parsed.pathname;
  const method = req.method.toUpperCase();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes
  if (_path.startsWith('/api/')) {
    const handled = await handleAPI(method, _path, req, res);
    if (!handled) json(res, { ok: false, error: 'Not found' }, 404);
    return;
  }

  // Serve HTML UI
  try {
    const content = fs.readFileSync(INDEX_HTML, 'utf-8');
    html(res, content);
  } catch (e) {
    html(res, `
      <html><body style="font-family:sans-serif;background:#1a1a2e;color:#e0e0e0;padding:40px">
      <h1>📁 Summarizer</h1>
      <p>Server running on port ${PORT}</p>
      <p>API: <a href="/api/groups" style="color:#4fc3f7">/api/groups</a></p>
      <p style="color:#8b949e">index.html not found — create it alongside start.js</p>
      </body></html>
    `);
  }
}).listen(PORT, () => {
  console.log(`📁 Summarizer → http://localhost:${PORT}`);
});