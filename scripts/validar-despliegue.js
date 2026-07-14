#!/usr/bin/env node

const FRONTEND_URL =
  process.env.ARTIFY_FRONTEND_URL || 'https://tecno85.github.io/artify/';
const BACKEND_URL = (
  process.env.ARTIFY_API_URL ||
  'https://artify-sena-postgresql.onrender.com'
).replace(/\/$/, '');
const TIMEOUT_MS = 60_000;

const comprobaciones = [
  {
    nombre: 'Frontend GitHub Pages',
    url: FRONTEND_URL,
    validar: async (respuesta) => {
      const html = await respuesta.text();
      return html.includes('Artify');
    },
  },
  {
    nombre: 'Configuración pública del frontend',
    url: new URL('assets/js/config.js', FRONTEND_URL).href,
    validar: async (respuesta) => {
      const contenido = await respuesta.text();
      return contenido.includes(`ARTIFY_API_URL = "${BACKEND_URL}"`);
    },
  },
  {
    nombre: 'Salud del backend',
    url: `${BACKEND_URL}/health`,
    validar: async (respuesta) => {
      const datos = await respuesta.json();
      return datos.ok === true && datos.servicio === 'artify-api';
    },
  },
  {
    nombre: 'Conexión con PostgreSQL',
    url: `${BACKEND_URL}/ready`,
    validar: async (respuesta) => {
      const datos = await respuesta.json();
      return datos.ok === true && datos.baseDatos === 'disponible';
    },
  },
  ...[
    'filtros-populares',
    'horarios-edicion',
    'formatos-preferidos',
    'tasa-conversion',
  ].map((recurso) => ({
    nombre: `Analytics: ${recurso}`,
    url: `${BACKEND_URL}/api/v1/analytics/${recurso}`,
    validar: async (respuesta) => {
      const datos = await respuesta.json();
      return datos.ok === true;
    },
  })),
];

async function solicitar(url, opciones = {}) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...opciones,
      cache: 'no-store',
      signal: controlador.signal,
    });
  } finally {
    clearTimeout(temporizador);
  }
}

async function comprobarCors() {
  const origen = new URL(FRONTEND_URL).origin;
  const respuesta = await solicitar(`${BACKEND_URL}/health`, {
    headers: { Origin: origen },
  });

  return {
    nombre: 'CORS del frontend público',
    correcto:
      respuesta.ok &&
      respuesta.headers.get('access-control-allow-origin') === origen,
    detalle: `HTTP ${respuesta.status}`,
  };
}

async function ejecutarComprobacion(comprobacion) {
  const inicio = performance.now();

  try {
    const respuesta = await solicitar(comprobacion.url);
    const contenidoValido =
      respuesta.ok && (await comprobacion.validar(respuesta));

    return {
      nombre: comprobacion.nombre,
      correcto: contenidoValido,
      detalle: `HTTP ${respuesta.status} · ${Math.round(performance.now() - inicio)} ms`,
    };
  } catch (error) {
    return {
      nombre: comprobacion.nombre,
      correcto: false,
      detalle: error.name === 'AbortError' ? 'Tiempo agotado' : error.message,
    };
  }
}

async function main() {
  console.log('Validación pública no destructiva de Artify');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend:  ${BACKEND_URL}\n`);

  const resultados = [];
  for (const comprobacion of comprobaciones) {
    resultados.push(await ejecutarComprobacion(comprobacion));
  }

  try {
    resultados.push(await comprobarCors());
  } catch (error) {
    resultados.push({
      nombre: 'CORS del frontend público',
      correcto: false,
      detalle: error.message,
    });
  }

  console.table(
    resultados.map((resultado) => ({
      comprobacion: resultado.nombre,
      estado: resultado.correcto ? 'Correcto' : 'Falló',
      detalle: resultado.detalle,
    }))
  );

  const fallos = resultados.filter((resultado) => !resultado.correcto);
  if (fallos.length > 0) {
    console.error(`La validación terminó con ${fallos.length} fallo(s).`);
    process.exitCode = 1;
    return;
  }

  console.log('Todos los servicios públicos respondieron correctamente.');
}

main();
