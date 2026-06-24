# Inventario de Consultas para Migración PostgreSQL

Este archivo registra los ajustes principales que se deben realizar al migrar consultas desde `mysql2` hacia `pg`.

## Estado del esquema

El archivo `schema.sql` fue validado en una instancia temporal de PostgreSQL 15.18.

Resultado:

- 5 tablas creadas: `USUARIO`, `CONFIGURACION`, `IMAGEN`, `SESION_EDICION`, `OPERACION`.
- Vista creada: `v_usuarios_activos`.
- `seed.sql` insertó un usuario administrador de referencia.

## Cambios globales necesarios

| MySQL actual | PostgreSQL requerido |
| --- | --- |
| Placeholder `?` | Placeholder `$1`, `$2`, `$3` |
| `result.insertId` | `RETURNING columna_id` |
| `result.affectedRows` | `result.rowCount` |
| `NOW()` | `CURRENT_TIMESTAMP` o `NOW()` |
| `DATE_SUB(NOW(), INTERVAL 8 HOUR)` | `CURRENT_TIMESTAMP - INTERVAL '8 hours'` |
| `HOUR(fecha)` | `EXTRACT(HOUR FROM fecha)` |
| `tinyint(1)` | `boolean` |
| `json` | `jsonb` |

## Archivos prioritarios

| Archivo | Prioridad | Motivo |
| --- | --- | --- |
| `backend/config/db.js` | Alta | Cambiar de `mysql2` a `pg`. |
| `backend/server.js` | Alta | Ajustar limpieza automática de sesiones. |
| `backend/controllers/auth.controller.js` | Alta | Registro, login, actualización de acceso e inserts con ID. |
| `backend/controllers/sesion.controller.js` | Alta | Inicio y cierre de sesiones. |
| `backend/controllers/actividad.controller.js` | Alta | Registro de operaciones e imágenes. |
| `backend/controllers/configuracion.controller.js` | Media | Guardado y lectura de configuración JSON. |
| `backend/controllers/admin.controller.js` | Media | CRUD administrativo. |
| `backend/controllers/analytics.controller.js` | Media | Agregaciones y funciones de fecha. |
| `backend/tests/api.test.js` | Alta | Validación completa de la migración. |

## Decisión inicial

Mantener nombres de tablas y columnas equivalentes al modelo actual para reducir cambios funcionales. En PostgreSQL se usarán comillas dobles en consultas cuando se referencien tablas en mayúscula.
