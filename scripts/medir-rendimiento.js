#!/usr/bin/env node

const URL_OBJETIVO =
  process.env.ARTIFY_LOAD_URL ||
  'https://artify-sena-postgresql.onrender.com/health';
const TOTAL_SOLICITUDES = obtenerEntero('ARTIFY_LOAD_REQUESTS', 25, 1, 100);
const CONCURRENCIA = obtenerEntero('ARTIFY_LOAD_CONCURRENCY', 5, 1, 10);
const TIMEOUT_MS = 15_000;

function obtenerEntero(nombre, valorDefecto, minimo, maximo) {
  const valor = Number(process.env[nombre] || valorDefecto);

  if (!Number.isInteger(valor) || valor < minimo || valor > maximo) {
    throw new Error(
      `${nombre} debe ser un entero entre ${minimo} y ${maximo}`
    );
  }

  return valor;
}

function percentil(valores, porcentaje) {
  const ordenados = [...valores].sort((a, b) => a - b);
  const indice = Math.min(
    ordenados.length - 1,
    Math.ceil((porcentaje / 100) * ordenados.length) - 1
  );
  return ordenados[Math.max(0, indice)];
}

async function solicitar() {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  const inicio = performance.now();

  try {
    const respuesta = await fetch(URL_OBJETIVO, {
      cache: 'no-store',
      signal: controlador.signal,
    });
    await respuesta.arrayBuffer();

    return {
      correcto: respuesta.ok,
      estado: respuesta.status,
      duracionMs: performance.now() - inicio,
    };
  } catch (error) {
    return {
      correcto: false,
      estado: error.name === 'AbortError' ? 'timeout' : 'error',
      duracionMs: performance.now() - inicio,
    };
  } finally {
    clearTimeout(temporizador);
  }
}

async function ejecutarTrabajador(resultados, contador) {
  while (contador.valor < TOTAL_SOLICITUDES) {
    contador.valor += 1;
    resultados.push(await solicitar());
  }
}

async function main() {
  console.log('Medición básica y limitada de Artify');
  console.log(`URL: ${URL_OBJETIVO}`);
  console.log(
    `Solicitudes: ${TOTAL_SOLICITUDES} · Concurrencia: ${CONCURRENCIA}\n`
  );

  const resultados = [];
  const contador = { valor: 0 };
  const inicio = performance.now();

  await Promise.all(
    Array.from({ length: CONCURRENCIA }, () =>
      ejecutarTrabajador(resultados, contador)
    )
  );

  const duracionTotalMs = performance.now() - inicio;
  const correctos = resultados.filter((resultado) => resultado.correcto);
  const duraciones = correctos.map((resultado) => resultado.duracionMs);
  const fallosPorEstado = resultados
    .filter((resultado) => !resultado.correcto)
    .reduce((grupos, resultado) => {
      grupos[resultado.estado] = (grupos[resultado.estado] || 0) + 1;
      return grupos;
    }, {});

  const resumen = {
    correctas: correctos.length,
    fallidas: resultados.length - correctos.length,
    duracion_total_ms: Math.round(duracionTotalMs),
    solicitudes_por_segundo: Number(
      (resultados.length / (duracionTotalMs / 1000)).toFixed(2)
    ),
  };

  if (duraciones.length > 0) {
    resumen.latencia_min_ms = Math.round(Math.min(...duraciones));
    resumen.latencia_promedio_ms = Math.round(
      duraciones.reduce((total, valor) => total + valor, 0) / duraciones.length
    );
    resumen.latencia_p50_ms = Math.round(percentil(duraciones, 50));
    resumen.latencia_p95_ms = Math.round(percentil(duraciones, 95));
    resumen.latencia_max_ms = Math.round(Math.max(...duraciones));
  }

  console.log(JSON.stringify(resumen, null, 2));

  if (Object.keys(fallosPorEstado).length > 0) {
    console.table(
      Object.entries(fallosPorEstado).map(([estado, cantidad]) => ({
        estado,
        cantidad,
      }))
    );
    process.exitCode = 1;
  }

  console.log(
    '\nEsta medición es un smoke test controlado; no demuestra capacidad para 250 usuarios ni reemplaza una prueba de carga formal.'
  );
}

main().catch((error) => {
  console.error(`No se pudo ejecutar la medición: ${error.message}`);
  process.exitCode = 1;
});
