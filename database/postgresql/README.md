# Migración PostgreSQL

Esta carpeta contiene los artefactos de trabajo para migrar Artify desde MySQL hacia PostgreSQL.

## Estado

Proyecto experimental creado a partir de `artify-sena`.

El backend todavía conserva la implementación MySQL original. La migración se realizará de forma controlada en fases.

## Archivos previstos

| Archivo | Propósito |
| --- | --- |
| `schema.sql` | Esquema PostgreSQL equivalente al modelo actual. |
| `seed.sql` | Datos mínimos para pruebas locales. |
| `queries.md` | Inventario de consultas adaptadas o pendientes. |

## Reglas

- Mantener `database/artify_db.sql` como referencia del modelo MySQL original.
- No eliminar pruebas existentes durante la migración.
- Validar registro, login, sesiones, configuración, operaciones y analíticas antes de considerar completa la migración.
