# PostgreSQL

Esta carpeta contiene los artefactos oficiales de base de datos para ejecutar Artify.

## Estado

PostgreSQL es el motor oficial de esta versión del proyecto.

El backend trabaja con PostgreSQL mediante `pg`. El esquema incluye reglas de integridad, cascadas, checks e índices de apoyo para analytics. Las pruebas automatizadas se validan contra PostgreSQL.

## Archivos disponibles

| Archivo | Propósito |
| --- | --- |
| `schema.sql` | Esquema PostgreSQL equivalente al modelo actual. |
| `seed.sql` | Datos mínimos para pruebas locales. |
| `promote-admin.sql` | Promueve a rol `admin` un usuario ya registrado. |
| `app-role.sql` | Crea o actualiza un rol técnico de aplicación sin permisos administrativos. |
| `migrations/` | Contiene cambios incrementales y no destructivos del esquema. |
| `queries.md` | Inventario técnico de consultas y decisiones de compatibilidad. |

## Ejecución local prevista

```bash
createdb artify_db
psql -d artify_db -f database/postgresql/schema.sql
psql -d artify_db -f database/postgresql/seed.sql
psql -d artify_db -v correo='admin@artify.com' -f database/postgresql/promote-admin.sql
```

Después de la carga inicial aplico las migraciones pendientes desde la raíz:

```bash
node scripts/ejecutar-migraciones.js --apply
```

El comando crea la tabla técnica `MIGRACION_ESQUEMA`, registra cada archivo
aplicado y no vuelve a ejecutar una versión ya registrada. Sin `--apply` solo
muestra el plan. Las instrucciones detalladas están en
[`migrations/README.md`](./migrations/README.md).

Para preparar un usuario técnico de mínimo privilegio uso `app-role.sql` con
valores proporcionados por `psql`; nunca escribo la contraseña real en Git:

```bash
psql -d artify_db \
  -v app_user='artify_app' \
  -v app_password='CONTRASENA_SEGURA' \
  -f database/postgresql/app-role.sql
```

Este rol puede conectarse, consultar y modificar las cinco tablas funcionales,
usar sus secuencias y leer la vista. No puede crear roles, bases ni objetos del
esquema.

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
- Aplicar cambios sobre bases con datos mediante migraciones incrementales, no volviendo a ejecutar `schema.sql`.
- Conectar el backend con un rol técnico sin privilegios de propietario siempre que el proveedor lo permita.
- Conservar las cascadas y restricciones `CHECK` cuando se agreguen nuevas relaciones o campos numéricos.
- Mantener índices coherentes con los endpoints de analytics antes de agregar nuevas consultas agregadas.
- No eliminar pruebas existentes durante la migración.
- Validar registro, login, sesiones, configuración, operaciones y analíticas antes de considerar completa la migración.
