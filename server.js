// Simple Node.js static file server (no external dependencies)
// Serves index.html at root and any files under the /resources directory (and other root files like main.js)
// Usage: node server.js  (optionally set PORT env var)

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const ROOT = __dirname; // project root where index.html lives

// Basic MIME types mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function sendError(res, status, message = http.STATUS_CODES[status] || 'Error') {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=UTF-8' });
  res.end(message);
}

function safeJoin(base, requestedPath) {
  const safePath = path.normalize(path.join(base, requestedPath));
  if (!safePath.startsWith(base)) return null; // prevent path traversal
  return safePath;
}

function serveFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return sendError(res, 404, 'Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    // Set simple caching for assets in resources (1 hour) - adjust as needed
    const headers = { 'Content-Type': mime };
    if (filePath.includes(path.sep + 'resources' + path.sep)) {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    res.writeHead(200, headers);
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => sendError(res, 500, 'Read Error'));
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  try {
    const url = decodeURI(req.url.split('?')[0]);

    // Root => index.html
    if (url === '/' || url === '') {
      const indexPath = path.join(ROOT, 'index.html');
      return serveFile(indexPath, res);
    }

    // Only allow files under root (includes resources, main.js, json files, etc.)
    const requested = safeJoin(ROOT, url);
    if (!requested) {
      return sendError(res, 400, 'Bad Request');
    }

    fs.stat(requested, (err, stats) => {
      if (err) return sendError(res, 404, 'Not Found');

      if (stats.isDirectory()) {
        // Try to serve index.html inside a directory, else 403
        const indexInDir = path.join(requested, 'index.html');
        return fs.stat(indexInDir, (idxErr, idxStats) => {
          if (!idxErr && idxStats.isFile()) {
            return serveFile(indexInDir, res);
          }
          return sendError(res, 403, 'Directory listing forbidden');
        });
      }

      return serveFile(requested, res);
    });
  } catch (e) {
    console.error('Request handling error:', e);
    sendError(res, 500, 'Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
  console.log('Serving directory:', ROOT);
});
