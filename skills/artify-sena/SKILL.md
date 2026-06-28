---
name: artify-sena
description: Usar cuando se trabaje en Artify SENA: código, documentación, pruebas, base de datos, autenticación, panel administrativo, editor de imágenes, analytics, evidencias académicas o pulido general del proyecto.
---

# Artify SENA

## Propósito

Este skill guía cómo trabajar en Artify sin duplicar su documentación. Usar `CONTEXT.md` para estado actual y `README.md` para instalación, uso e índice documental principal.

## Lectura Inicial

Leer solo lo necesario para la tarea:

- Siempre: `CONTEXT.md` para estructura real, rutas activas, decisiones vigentes y estado del proyecto.
- Instalación, uso o navegación documental: `README.md`.
- Estilo y convenciones: `docs/tecnica/coding-standards.md`.
- Base de datos: `database/postgresql/schema.sql`, `database/postgresql/seed.sql`, `database/postgresql/queries.md` y `docs/tecnica/base-datos.md`.
- Analytics, despliegue, pruebas o evidencias: documento técnico correspondiente dentro de `docs/tecnica/`.

Si cambia el estado real del proyecto, actualizar `CONTEXT.md` en el mismo trabajo. Si se agregan o eliminan documentos relevantes, actualizar el índice documental del `README.md`; no depender de `docs/README.md` como índice principal.

## Reglas De Trabajo

- Mantener la arquitectura actual de esta variante: frontend HTML/CSS/JavaScript Vanilla, backend Node.js + Express, PostgreSQL mediante `pg` y `pnpm`.
- No introducir frameworks frontend, TypeScript, bundlers, ORMs ni cambios grandes de arquitectura sin aprobación explícita.
- Preservar la separación entre `frontend/`, `backend/`, `database/`, `docs/`, `scripts/` y `skills/`.
- Usar nombres y textos en español cuando el archivo existente esté en español.
- Hacer cambios pequeños, trazables y enfocados en la tarea; evitar reescrituras amplias.

## Backend, API Y Seguridad

- Usar `pnpm` dentro de `backend/`; no mezclar gestores ni generar lockfiles alternos.
- Mantener el backend modular: rutas para endpoints, controladores para lógica, middlewares para autenticación/autorización y utils para helpers compartidos.
- Validar siempre en backend, aunque el frontend también valide.
- Consultar `CONTEXT.md` antes de cambiar rutas o contratos API; no duplicar aquí listas de endpoints.
- No cambiar respuestas existentes sin revisar frontend y pruebas que dependan de campos como `mensaje`, `usuario`, `token`, `usuarios` o `estadisticas`.
- Proteger invariantes: contraseñas con bcrypt, tokens firmados por backend, autorización por rol/propietario, rechazo de IDs malformados y payloads inválidos.
- Mantener `.env` fuera del repositorio y actualizar `.env.example` si cambian variables requeridas.

## Frontend Y Base De Datos

- En frontend, preservar la estructura por página y reutilizar iconos existentes de `frontend/assets/icons/` antes de agregar nuevos.
- Al tocar autenticación, comprobar redirección por rol: admin a `admin.html`, usuario a `editor.html`.
- Al tocar editor, considerar Canvas, historial deshacer/rehacer, zoom, filtros, recorte, redimensionamiento, conversión y registro de operaciones.
- Escapar o renderizar de forma segura datos de usuario/base de datos antes de insertarlos en HTML; evitar valores crudos en `innerHTML` o parámetros inline.
- En PostgreSQL, mantener tablas en mayúsculas y columnas con prefijos (`usr_`, `ses_`, `opr_`, `img_`, `cfg_`), usando comillas dobles en SQL directo cuando corresponda.
- Recordar que `backend/config/db.js` conserva compatibilidad con consultas heredadas: adapta placeholders `?` a `$1`, `$2`, cita tablas en mayúscula y normaliza resultados como `insertId` y `affectedRows`.
- Si cambia el esquema, actualizar juntos SQL, documentación, pruebas y controladores afectados.

## Documentación Y Evidencias

- Mantener implementado y futuro separados: no documentar ideas planeadas como funcionalidades existentes.
- No prometer demo pública, atajos de teclado, formatos de imagen u otras funciones si no existen en la aplicación real.
- Actualizar docs con el mismo cambio que modifica el comportamiento correspondiente.
- Usar `docs/proyecto/` para material funcional/académico y `docs/tecnica/` para arquitectura, base de datos, despliegue, pruebas, analytics y estándares.
- Crear o modificar evidencias en `docs/**/evidencias/` solo cuando el usuario lo pida o la entrega académica lo requiera.
- Si cambian formatos admitidos por el editor, mantener coherentes `frontend/pages/editor.html`, `frontend/assets/js/editor.js`, `README.md` y documentación relacionada.

## Validación

Elegir según el cambio:

- Sintaxis backend: `cd backend && pnpm run check`.
- Backend/auth/API/BD: `cd backend && pnpm test`.
- Backend local: `cd backend && pnpm start` o `pnpm run dev`.
- Frontend estático: servir `frontend/` con `npx http-server frontend` y revisar en navegador cuando aplique.
- Base de datos: verificar contra `database/postgresql/schema.sql`, `database/postgresql/seed.sql` y PostgreSQL local `artify_db` cuando esté disponible.

Si una validación no puede ejecutarse por PostgreSQL, variables de entorno o sandbox, decir exactamente qué faltó.

## Cierre Y Commits

Cuando se hagan cambios relevantes de código, documentación, pruebas, base de datos, evidencias o funcionalidades, cerrar la respuesta con:

- resumen breve de cambios
- validaciones ejecutadas
- commit sugerido basado en el conjunto de cambios pendientes

Antes de proponer commits, revisar `git status` y, cuando ayude, `git diff --stat`. Si los cambios forman una unidad lógica, sugerir un solo commit corto. Si mezclan intenciones distintas, sugerir varios commits agrupados por intención.

Usar Conventional Commits según `docs/tecnica/coding-standards.md`, con formato `tipo(scope): descripción`. Tipos habituales: `feat`, `fix`, `docs`, `test`, `chore`, `style`, `refactor`. Scopes útiles en Artify: `auth`, `admin`, `editor`, `analytics`, `db`, `docs`, `skill`, `frontend`, `backend`.

No ejecutar `git commit` ni `git push` salvo que el usuario lo pida explícitamente; el usuario revisa el commit sugerido y hace push manual.

## Prioridades De Pulido

Cuando el usuario pida revisar o mejorar Artify, mirar primero:

- documentación desactualizada frente al código real
- respuestas API inconsistentes
- pruebas faltantes para admin CRUD, analytics o autenticación
- renderizado inseguro de datos en frontend
- IDs malformados en controladores backend
- analytics sobre tablas vacías
- flujos frontend rotos tras cambios API
- riesgos de filtración de secretos
- validación duplicada que debería vivir en un helper backend
- evidencias académicas sin fecha, trazabilidad o correspondencia con el estado real
