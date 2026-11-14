import { gzipSync } from 'node:zlib';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist/web/browser');
const prefix = process.env.BASE_PATH || '';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    if (prefix && path.startsWith(prefix + '/'))
      path = path.slice(prefix.length);
    let file = resolve(root, '.' + path);
    if (!file.startsWith(root + '/') && file !== root) throw Error('Forbidden');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    res.setHeader(
      'Content-Type',
      types[extname(file)] || 'application/octet-stream',
    );
    const body = await readFile(file);
    res.setHeader(
      'Cache-Control',
      file.includes('/_next/static/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=600',
    );
    if ((req.headers['accept-encoding'] || '').includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.end(gzipSync(body));
    } else res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
}).listen(8080, '0.0.0.0');
