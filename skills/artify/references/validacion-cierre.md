# Validación Y Cierre

Leer esta referencia cuando la tarea modifique archivos, solicite pruebas o revisión, o necesite preparar una entrega o commit sugerido.

## Validar Por Capas

Ejecutar primero la comprobación más rápida y cercana al cambio, y ampliar según el riesgo:

1. Sintaxis o prueba específica.
2. Suite del dominio afectado.
3. Suites de consumidores o componentes relacionados.
4. E2E o revisión en navegador para flujos visibles.

Comandos disponibles:

- Sintaxis backend: `cd backend && pnpm run check`.
- Backend, autenticación, API o base de datos: `cd backend && pnpm test`.
- Frontend automatizado: `cd backend && pnpm run test:frontend`.
- Editor E2E: `cd backend && pnpm run test:e2e`.
- Backend local: `cd backend && pnpm start` o `pnpm run dev`.
- Frontend estático: `python3 -m http.server 8080 --directory frontend` desde la raíz.
- Migraciones: revisar primero `node scripts/ejecutar-migraciones.js` sin `--apply`.

Ejecutar pruebas de integración únicamente con `NODE_ENV=test`, confirmación explícita y una base cuyo nombre termine en `_test`; no desactivar guardas ni usar datos de desarrollo o producción.

No afirmar que una validación pasó si no se ejecutó. Distinguir con claridad entre validado automáticamente, inspeccionado manualmente y no ejecutado. Explicar exactamente cualquier bloqueo por PostgreSQL, variables de entorno, navegador, dependencias o sandbox.

## Cerrar La Tarea

Cuando queden cambios relevantes:

- Resumir el resultado y los archivos o dominios afectados.
- Enumerar las validaciones ejecutadas y sus resultados.
- Mencionar riesgos o comprobaciones pendientes.
- Revisar `git status` y, cuando ayude, `git diff --stat` sin confundir cambios del usuario con los propios.
- Sugerir commits solo para unidades lógicas identificables; no incluir automáticamente cambios preexistentes ajenos a la tarea.

Usar Conventional Commits según `docs/tecnica/coding-standards.md`, con descripción en español y formato `tipo(scope): descripción`. Usar scopes como `auth`, `admin`, `editor`, `analytics`, `db`, `docs`, `skill`, `frontend` o `backend` cuando correspondan.

No ejecutar `git commit` ni `git push` salvo solicitud explícita.

## Revisión General

Cuando el usuario pida revisar o mejorar Artify sin delimitar un módulo, priorizar:

- Diferencias entre documentación y código real.
- Contratos API inconsistentes y consumidores afectados.
- Pruebas faltantes en autenticación, administración, analytics y editor.
- Renderizado inseguro, accesibilidad y flujos frontend rotos.
- IDs o payloads malformados y validación backend duplicada.
- Analytics sobre tablas vacías.
- Secretos o datos personales expuestos.
- Evidencias sin fecha, trazabilidad o correspondencia con el estado real.
