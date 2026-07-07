# PostgreSQL

Esta carpeta contiene los artefactos oficiales de base de datos para ejecutar Artify.

## Estado

PostgreSQL es el motor oficial de esta versión del proyecto.

El backend trabaja con PostgreSQL mediante `pg`. El esquema incluye reglas de integridad, cascadas, checks e índices de apoyo para analytics. Las pruebas automatizadas se validan contra PostgreSQL.

## Archivos previstos

| Archivo | Propósito |
| --- | --- |
| `schema.sql` | Esquema PostgreSQL equivalente al modelo actual. |
| `seed.sql` | Datos mínimos para pruebas locales. |
| `promote-admin.sql` | Promueve a rol `admin` un usuario ya registrado. |
| `queries.md` | Inventario técnico de consultas y decisiones de compatibilidad. |

## Ejecución local prevista

```bash
createdb artify_db
psql -d artify_db -f database/postgresql/schema.sql
psql -d artify_db -f database/postgresql/seed.sql
psql -d artify_db -v correo='admin@artify.com' -f database/postgresql/promote-admin.sql
```

Verificación:

```sql
\l
\c artify_db
\dt
\dv
```

## Reglas

- Mantener `database/postgresql/schema.sql` como esquema activo de Artify.
- Recordar que `schema.sql` crea objetos dentro de una base existente; la base se crea antes con `createdb artify_db` o desde el proveedor elegido.
- Ejecutar `schema.sql` solo para carga inicial o reinicio controlado, porque elimina y vuelve a crear tablas y vista del proyecto.
- Tratar `seed.sql` como datos mínimos de referencia, no como credenciales reales ni usuario administrador válido.
- Usar `promote-admin.sql` solo después de registrar el usuario que actuará como administrador.
- Conservar las cascadas y restricciones `CHECK` cuando se agreguen nuevas relaciones o campos numéricos.
- Mantener índices coherentes con los endpoints de analytics antes de agregar nuevas consultas agregadas.
- No eliminar pruebas existentes durante la migración.
- Validar registro, login, sesiones, configuración, operaciones y analíticas antes de considerar completa la migración.
