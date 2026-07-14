const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const RAIZ_FRONTEND = path.resolve(__dirname, '..', '..', '..', 'frontend');
const HOST = '127.0.0.1';
const PORT = 4173;
const TIPOS_MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function resolverRuta(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${HOST}`).pathname);
  const relativa = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const ruta = path.resolve(RAIZ_FRONTEND, relativa);

  if (
    ruta !== RAIZ_FRONTEND &&
    !ruta.startsWith(`${RAIZ_FRONTEND}${path.sep}`)
  ) {
    return null;
  }

  return ruta;
}

const servidor = http.createServer((req, res) => {
  const ruta = resolverRuta(req.url || '/');
  if (!ruta || !fs.existsSync(ruta) || !fs.statSync(ruta).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Recurso no encontrado');
    return;
  }

  res.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type':
      TIPOS_MIME[path.extname(ruta)] || 'application/octet-stream',
  });
  fs.createReadStream(ruta).pipe(res);
});

servidor.listen(PORT, HOST, () => {
  console.log(`Frontend de pruebas disponible en http://${HOST}:${PORT}`);
});

function cerrar() {
  servidor.close(() => process.exit(0));
}

process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
