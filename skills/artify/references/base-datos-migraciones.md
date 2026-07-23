# Base De Datos Y Migraciones

Leer esta referencia al trabajar en `database/`, SQL, persistencia, respaldo, restauración, migraciones o `backend/config/db.js`.

## Fuentes Y Convenciones

- Consultar `database/postgresql/schema.sql`, `seed.sql`, `queries.md`, `database/postgresql/README.md` y `docs/tecnica/base-datos.md` según la tarea.
- Mantener tablas en mayúsculas y columnas con prefijos `usr_`, `ses_`, `opr_`, `img_` y `cfg_`; usar comillas dobles en SQL directo cuando corresponda.
- Consultar `CONTEXT.md` antes de cambiar la compatibilidad de `backend/config/db.js` y revisar todos los controladores y pruebas dependientes.
- Mantener coherentes claves, restricciones, índices, datos semilla, consultas, controladores y documentación.

## Cambios De Esquema

- Crear una migración incremental para todo cambio posterior al esquema inicial; no depender únicamente de modificar `schema.sql`.
- Mantener tanto la instalación nueva mediante `schema.sql` como la actualización de bases existentes mediante migraciones.
- No alterar una migración ya aplicada salvo confirmación de que aún no se ha usado o una instrucción explícita con procedimiento controlado.
- Preferir migraciones acotadas, ordenadas y verificables una sola vez.
- Conservar datos existentes o documentar con precisión cualquier eliminación o transformación intencional.

## Ejecución Segura

- Revisar primero el plan con `node scripts/ejecutar-migraciones.js` sin `--apply`.
- Aplicar migraciones solo sobre un destino identificado y autorizado.
- No omitir las guardas para bases remotas ni apuntar pruebas destructivas a desarrollo o producción.
- Probar cambios de alto impacto sobre una base temporal o respaldo restaurado antes de considerar una migración completa.
- Al tocar respaldo o restauración, preservar limpieza automática, mínimo privilegio y ausencia de credenciales en artefactos.

Revisar después backend, pruebas y documentos que describan el modelo; no actualizar archivos que sigan siendo correctos.
