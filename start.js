#!/usr/bin/env node
/**
 * Summarizer — EventMath Desktop File Organizer
 * 
 * ARCHITECTURE:
 *   - EventMath server (summarizer.js) handles GET API on port 3001
 *   - This wrapper serves HTML UI + handles POST operations on port 3003
 *   - GET /api/* calls are proxied to the EventMath server
 *   - POST /api/* (delete) happens directly in this wrapper
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

const EVENTMATH_PORT = 3001;
const UI_PORT = process.env.PORT || 3003;
const INDEX_HTML = path.join(__dirname, 'index.html');

// ── Start EventMath server as a child process ──

function startEventMathServer() {
  const emProcess = spawn('node', [path.join(__dirname, 'summarizer.js')], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(EVENTMATH_PORT) }
  });
  emProcess.stdout.on('data', d => process.stdout.write(`  [EventMath] ${d}`));
  emProcess.stderr.on('data', d => process.stderr.write(`  [EventMath] ${d}`));
  emProcess.on('exit', (code) => {
    console.log(`  EventMath server exited (code ${code})`);
  });
  console.log(`  EventMath API → http://localhost:${EVENTMATH_PORT}`);
  return emProcess;
}

// ── Helpers ──

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function html(res, content, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(content);
}

// ── Proxy to EventMath server ──

function proxyToEventMath(method, _path, res) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: EVENTMATH_PORT,
      path: _path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', c => data += c);
            proxyRes.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                // EventMath spawn returns { stdout, stderr, exitCode, protocol_info }
                // Extract the actual JSON from stdout if present
                if (parsed.stdout && parsed.stdout.trim()) {
                  try {
                    const inner = JSON.parse(parsed.stdout);
                    json(res, inner, proxyRes.statusCode);
                  } catch {
                    // stdout isn't JSON, return raw spawn result
                    json(res, parsed, proxyRes.statusCode);
                  }
                } else {
                  json(res, parsed, proxyRes.statusCode);
                }
              } catch {
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
              }
              resolve(true);
      });
    });

    proxyReq.on('error', (e) => {
      json(res, { ok: false, error: `EventMath unavailable: ${e.message}` }, 503);
      resolve(true);
    });

    proxyReq.end();
  });
}

// ── Direct POST handlers ──

async function handlePostAPI(_path, req, res) {
  const body = await readBody(req);

  if (_path === '/api/delete') {
    if (!body.path) return json(res, { ok: false, error: 'Missing path' }, 400);
    try {
      fs.unlinkSync(body.path);
      json(res, { ok: true, deleted: body.path });
    } catch (e) {
      json(res, { ok: false, error: `Cannot delete: ${e.message}` }, 500);
    }
    return true;
  }

  if (_path === '/api/delete-group') {
    const paths = body.paths || [];
    if (!paths.length) return json(res, { ok: false, error: 'Missing paths' }, 400);
    const results = [];
    for (const p of paths) {
      try {
        fs.unlinkSync(p);
        results.push({ path: p, ok: true });
      } catch (e) {
        results.push({ path: p, ok: false, error: e.message });
      }
    }
    json(res, {
      ok: true,
      deleted: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results
    });
    return true;
  }

  return false;
}

// ── Main Server ──

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);
  const _path = parsed.pathname;
  const method = req.method.toUpperCase();

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (_path.startsWith('/api/')) {
    if (method === 'POST') {
      const handled = await handlePostAPI(_path, req, res);
      if (!handled) json(res, { ok: false, error: 'Not found' }, 404);
    } else {
      await proxyToEventMath(method, _path, res);
    }
    return;
  }

  // Serve HTML UI
  try {
    const content = fs.readFileSync(INDEX_HTML, 'utf-8');
    html(res, content);
  } catch {
    html(res, `<html style="background:#0d1117;color:#e6edf3;padding:40px;font-family:sans-serif">
      <h1>📁 Summarizer</h1>
      <p>Running on port ${UI_PORT}</p>
      <p><a href="/api/groups" style="color:#4fc3f7">/api/groups</a></p>
    </html>`);
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${UI_PORT} in use. Try: PORT=3004 node start.js`);
  } else {
    console.error(e);
  }
  process.exit(1);
});

server.listen(UI_PORT, () => {
  console.log('');
  console.log('  📁 Summarizer');
  console.log('  ═══════════════');
  console.log(`  UI → http://localhost:${UI_PORT}`);
  startEventMathServer();
  console.log('');
});