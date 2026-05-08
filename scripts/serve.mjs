#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, dirname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(join(here, '..', 'project'));
const port = Number(process.env.PORT || 4173);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jsx': 'text/babel; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch (e) {
      // Malformed percent-encoding (e.g. "%E0%") is a client bug, not a
      // server error — surface it as 400 rather than letting URIError
      // become a 500.
      res.writeHead(400);
      res.end('bad request: malformed url');
      return;
    }
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }
    // Strip leading slash so path.join treats the request as a relative path
    // anchored at `root`, then resolve to an absolute path to make the
    // traversal guard correct on every OS (path.join would otherwise behave
    // differently for inputs starting with a separator).
    const relative = pathname.replace(/^\/+/, '');
    const filePath = normalize(resolve(root, relative));
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const fileStat = await stat(filePath).catch(() => null);
    if (!fileStat || !fileStat.isFile()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mime[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (err) {
    // Log full error server-side; respond with a generic 500 body so we never
    // leak absolute filesystem paths, stack frames or internal detail to the
    // browser.
    console.error('serve: unhandled error', err);
    res.writeHead(500);
    res.end('internal server error');
  }
});

server.listen(port, () => {
  console.log('admin static server listening on http://127.0.0.1:' + port);
});
