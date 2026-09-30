#!/usr/bin/env node
/**
 * Tiny, dependency-free local preview server.
 *
 * Usage:
 *   node build.js        (builds the site into /dist)
 *   node serve.js         (serves /dist at http://localhost:8080)
 *
 * No packages, no config — just Node's built-in "http" and "fs" modules.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

if (!fs.existsSync(DIST)) {
  console.error('No /dist folder found yet. Run "node build.js" first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(DIST, urlPath);

  if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (err2, content) => {
      if (err2) {
        // Fall back to the site's own 404 page if it exists
        fs.readFile(path.join(DIST, '404.html'), (err3, content404) => {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(err3 ? '404 Not Found' : content404);
        });
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Whit's World is previewing at http://localhost:${PORT}`);
});
