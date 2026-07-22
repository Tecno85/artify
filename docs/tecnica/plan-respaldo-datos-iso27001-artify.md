# Plan de migración y respaldo de datos de Artify con referencia en ISO 27001

> **Evidencia:** GA10-220501097-AA9 - Documentar el proceso de migración y respaldo de los datos<br>
> **Producto:** Documentación de plan de migración y respaldo de los datos del software<br>
> **Proyecto formativo:** Artify<br>
> **Aprendiz:** Iván Darío Madrid Daza<br>
> **Programa:** Análisis y Desarrollo de Software - SENA<br>
> **Fecha:** Julio de 2026

---

## Introducción

En esta evidencia documento el plan que aplicaría para proteger los datos de Artify mediante copias de respaldo, pruebas de restauración y controles de acceso. Tomo como referencia la norma ISO/IEC 27001 porque esta orienta la gestión de la seguridad de la información mediante identificación de riesgos, controles, responsabilidades, información documentada y mejora continua (ISO/IEC, 2022).

Artify es una aplicación web de edición de imágenes con frontend HTML, CSS y JavaScript, backend Node.js con Express y base de datos PostgreSQL. En esta versión, PostgreSQL es el motor oficial de persistencia. Por eso, el plan se centra especialmente en la base `artify_db`, sus tablas principales, los scripts SQL, las variables de entorno y la documentación técnica del proyecto.

<img src="./evidencias/respaldo-datos-iso27001/ciclo-respaldo-artify.svg" alt="Ciclo de respaldo de Artify" style="border-radius: 18px; width: 100%;">

## Objetivo

Mi objetivo es definir un plan claro y aplicable para que la información crítica de Artify pueda recuperarse ante errores humanos, fallos técnicos, corrupción de datos, cambios mal ejecutados o incidentes de seguridad.

Con este plan busco cuidar tres principios básicos de seguridad de la información:

- **Confidencialidad:** que los respaldos solo sean consultados por personas autorizadas.
- **Integridad:** que los respaldos no sean alterados sin control.
- **Disponibilidad:** que Artify pueda recuperarse en un tiempo razonable si ocurre un incidente.

## Alcance del plan

Este plan cubre los datos y recursos que permiten reconstruir o recuperar Artify:

| Recurso | Incluido en el plan | Motivo |
| --- | --- | --- |
| Base PostgreSQL `artify_db` | Sí | Contiene usuarios, configuraciones, sesiones, operaciones y metadatos de imágenes. |
| `database/postgresql/schema.sql` | Sí | Permite reconstruir la estructura de la base. |
| `database/postgresql/seed.sql` | Sí | Permite cargar datos mínimos de verificación. |
| `.env` y variables de entorno | Sí, con manejo restringido | Contienen credenciales y secretos; no deben subirse al repositorio. |
| Código fuente en GitHub | Sí | Permite recuperar backend, frontend, scripts y documentación. |
| Imágenes editadas por usuarios | Parcial | Artify registra metadatos; los archivos finales se descargan en el equipo del usuario. |
| Documentación técnica | Sí | Explica instalación, despliegue, migración y estructura de datos. |

## Identificación de datos críticos

Para decidir qué debo respaldar primero, clasifico los datos según su valor para el funcionamiento del sistema y el impacto que tendría perderlos.

<img src="./evidencias/respaldo-datos-iso27001/datos-criticos-artify.svg" alt="Datos críticos protegidos en Artify" style="border-radius: 18px; width: 100%;">

| Dato crítico | Ubicación | Nivel | Justificación |
| --- | --- | --- | --- |
| Usuarios registrados | Tabla `USUARIO` | Alto | Contiene datos personales, correo, rol, estado y hash de contraseña. |
| Credenciales y secretos | `.env`, `DATABASE_URL`, `TOKEN_SECRET` | Alto | Permiten conectar la base y firmar tokens; si se filtran, comprometen el sistema. |
| Configuración de usuario | Tabla `CONFIGURACION` | Medio | Guarda preferencias que personalizan la experiencia del editor. |
| Sesiones de edición | Tabla `SESION_EDICION` | Medio | Permiten trazabilidad del uso del editor. |
| Operaciones del editor | Tabla `OPERACION` | Alto | Soportan historial, estadísticas y analíticas. |
| Metadatos de imágenes | Tabla `IMAGEN` | Medio | Registran información de imágenes procesadas, formato y tamaño. |
| Scripts SQL | `database/postgresql/` | Alto | Permiten reconstruir la base y validar migraciones. |
| Código fuente | Repositorio GitHub | Alto | Permite recuperar la aplicación completa. |

En Artify considero más críticos los datos de `USUARIO`, los secretos de entorno y las operaciones del editor, porque están relacionados con autenticación, autorización, trazabilidad y funcionamiento del backend.

## Políticas de copia de seguridad

Defino estas políticas para que las copias no dependan de la memoria o de acciones improvisadas. La norma ISO 27001 exige que la organización planifique controles de acuerdo con sus riesgos; por eso, en Artify convierto el respaldo en una rutina documentada y verificable.

### Frecuencia

| Tipo de respaldo | Frecuencia | Contenido | Responsable |
| --- | --- | --- | --- |
| Respaldo diario | Cada día al finalizar la jornada | Base `artify_db` | Administrador técnico |
| Respaldo semanal completo | Cada domingo | Base, scripts SQL y documentación | Administrador técnico |
| Respaldo antes de cambios | Antes de migraciones, despliegues o cambios de esquema | Base actual y scripts | Desarrollador responsable |
| Respaldo mensual de conservación | Una vez al mes | Copia completa verificada | Responsable del proyecto |

### Método

Para PostgreSQL usaría `pg_dump` porque permite exportar la base en un archivo reutilizable. El comando de referencia sería:

```bash
pg_dump "$DATABASE_URL" \
  --format=custom \
  --file="backups/artify_db_$(date +%Y-%m-%d).backup"
```

Para una copia SQL legible, útil para revisión académica o diagnóstico, podría usar:

```bash
pg_dump "$DATABASE_URL" \
  --format=plain \
  --file="backups/artify_db_$(date +%Y-%m-%d).sql"
```

### Ubicaciones de almacenamiento

Aplicaría una regla sencilla inspirada en la práctica 3-2-1:

| Copia | Ubicación | Protección |
| --- | --- | --- |
| Copia principal | Almacenamiento privado del administrador | Carpeta no sincronizada públicamente. |
| Copia secundaria | Unidad externa o almacenamiento privado en la nube | Cifrado y acceso restringido. |
| Copia de emergencia | Proveedor de base de datos o exportación mensual | Separada del equipo local. |

No guardaría respaldos reales dentro del repositorio público, porque podrían contener datos personales o hashes de contraseña. En el repositorio solo conservaría scripts, plantillas, documentación y ejemplos sin datos sensibles.

### Retención

| Tipo | Tiempo de conservación |
| --- | --- |
| Diarios | 7 días |
| Semanales | 4 semanas |
| Mensuales | 3 meses |
| Antes de migración importante | Hasta validar que el cambio quedó estable |

### Política operativa para Neon

La recuperación ofrecida por el proveedor es una capa complementaria y no
reemplaza las exportaciones controladas por el proyecto. Para la base pública
de Neon aplico estos objetivos:

| Control | Objetivo |
| --- | --- |
| RPO | Máximo 24 horas de datos entre respaldos lógicos programados |
| RTO | Restaurar una base funcional y reconectar el backend en máximo 4 horas |
| Copia diaria | `pg_dump` en formato personalizado hacia almacenamiento privado cifrado |
| Copia previa a cambios | Obligatoria antes de migraciones o modificaciones de esquema |
| Retención externa | 7 diarias, 4 semanales y 3 mensuales |
| Prueba de restauración | Mensual sobre PostgreSQL temporal, nunca sobre producción |
| Revisión del proveedor | Trimestral y después de cualquier cambio de plan de Neon |

En la revisión trimestral registro, desde el panel vigente de Neon, si el plan
activo ofrece restauración temporal, historial o retención administrada y por
cuánto tiempo. No presupongo esas capacidades porque pueden cambiar según el
plan contratado. Si la retención del proveedor es menor que el RPO definido,
mantengo como control principal las exportaciones privadas externas.

La verificación trimestral debe dejar estos campos sin incluir secretos:

| Campo | Registro requerido |
| --- | --- |
| Fecha y responsable | Momento de la revisión y persona que la realizó |
| Proyecto y entorno | Identificador no sensible y confirmación de producción |
| Capacidad observada | Tipo de recuperación y ventana indicada por Neon |
| Última exportación externa | Fecha, tamaño y checksum del archivo cifrado |
| Última restauración probada | Fecha, base temporal y resultado |
| Acción correctiva | Ajuste requerido o `No aplica` |

No ejecuto `pg_dump` de producción desde CI porque el artefacto contendría datos
personales y hashes de contraseña. La exportación se realiza desde un entorno
administrativo autorizado, se cifra antes de salir de ese entorno y nunca se
adjunta como artefacto de GitHub Actions.

### Protección del archivo de respaldo

Cada backup debe quedar comprimido o cifrado cuando salga del entorno local. Para nombrarlo usaría una convención estable:

```text
artify_db_YYYY-MM-DD_tipo_entorno.backup
```

Ejemplo:

```text
artify_db_2026-07-08_completo_produccion.backup
```

## Pruebas de restauración

No me basta con generar copias; también debo comprobar que se puedan restaurar. Una copia que nunca se prueba puede dar una falsa sensación de seguridad.

<img src="./evidencias/respaldo-datos-iso27001/prueba-restauracion-artify.svg" alt="Prueba de restauración de respaldos en Artify" style="border-radius: 18px; width: 100%;">

### Frecuencia de pruebas

| Prueba | Frecuencia | Resultado esperado |
| --- | --- | --- |
| Restauración técnica | Mensual | El backup carga en una base temporal sin errores. |
| Validación funcional | Mensual | Login, registro, admin y analytics responden correctamente. |
| Prueba antes de migración | Antes de cambios de esquema | Se confirma que existe punto de regreso. |
| Registro de evidencia | En cada prueba | Fecha, archivo usado, responsable y resultado. |

### Procedimiento de restauración

Primero crearía una base temporal:

```bash
createdb artify_restore_test
```

Luego restauraría el backup:

```bash
pg_restore \
  --dbname=artify_restore_test \
  --clean \
  --if-exists \
  "backups/artify_db_2026-07-08_completo_produccion.backup"
```

Si el respaldo está en formato SQL plano:

```bash
psql -d artify_restore_test -f backups/artify_db_2026-07-08_completo_produccion.sql
```

Después validaría los objetos principales:

```sql
\dt
\dv
SELECT COUNT(*) FROM "USUARIO";
SELECT COUNT(*) FROM "OPERACION";
SELECT COUNT(*) FROM "SESION_EDICION";
```

Finalmente probaría el backend apuntando temporalmente a la base restaurada y revisaría:

- `GET /health`
- login de usuario registrado
- acceso de administrador
- consulta de usuarios del panel admin
- consulta de analytics
- registro de una sesión y una operación de prueba

## Control de acceso

Para proteger los respaldos, limito el acceso a las personas y procesos que realmente lo necesitan.

| Rol | Acceso permitido | Restricción |
| --- | --- | --- |
| Administrador técnico | Crear, restaurar y eliminar backups vencidos | Debe usar credenciales privadas y no compartir dumps sin cifrar. |
| Desarrollador del proyecto | Solicitar respaldo antes de cambios importantes | No debe conservar datos reales innecesarios. |
| Evaluador académico | Revisar documentación y evidencias | No recibe bases reales ni secretos. |
| Usuario final | Sin acceso a respaldos | Solo accede a sus funciones dentro de Artify. |

Las credenciales de base de datos, `DATABASE_URL`, `TOKEN_SECRET` y archivos `.env` se mantienen fuera del repositorio. Si debo compartir evidencia académica, uso capturas, tablas anonimizadas o datos de prueba.

También aplicaría estas reglas:

- Usar contraseñas fuertes para cuentas de base de datos y proveedores.
- Activar doble factor de autenticación cuando el proveedor lo permita.
- No enviar backups reales por correo o mensajería sin cifrado.
- Eliminar respaldos vencidos de forma controlada.
- Registrar quién generó, movió o restauró un backup.

## Gestión del riesgo

Integro las copias de respaldo al proceso de riesgos porque ISO 27001 no trata la seguridad como una acción aislada. El respaldo es un control para reducir impactos sobre disponibilidad, integridad y confidencialidad.

| Riesgo | Impacto | Probabilidad | Control propuesto |
| --- | --- | --- | --- |
| Eliminación accidental de usuarios o sesiones | Alto | Media | Backup diario y restauración mensual probada. |
| Error durante una migración SQL | Alto | Media | Backup previo obligatorio y base temporal de ensayo. |
| Filtración de un archivo `.backup` | Alto | Baja | Cifrado, acceso mínimo y no subir dumps a GitHub. |
| Corrupción de datos en producción | Alto | Baja | Retención por fechas y validación con consultas. |
| Indisponibilidad del proveedor de base de datos | Medio | Baja | Copia externa mensual y documentación de restauración. |
| Pérdida del archivo `.env` local | Medio | Media | Gestor seguro de secretos y plantilla `.env.example` sin credenciales reales. |

Cuando un riesgo tenga impacto alto, no lo acepto sin control. Primero defino respaldo, responsable, frecuencia, prueba de restauración y evidencia.

## Integración con el proceso de migración

Artify ya fue migrado a PostgreSQL. Para futuras migraciones, aplicaría este orden:

1. Hago backup completo de `artify_db`.
2. Verifico que el backup exista y tenga tamaño coherente.
3. Restauro el backup en una base temporal.
4. Ejecuto los cambios SQL en la base temporal.
5. Pruebo backend, login, admin, sesiones y analytics.
6. Si todo funciona, aplico el cambio al entorno real.
7. Documento fecha, cambio realizado, respaldo usado y resultado.

Con esto evito ejecutar cambios directos sin punto de regreso. En especial, debo tener cuidado con `schema.sql`, porque ese archivo elimina y recrea objetos; por eso solo debe usarse para carga inicial o reinicio controlado con respaldo previo.

## Relación con ISO 27001

No afirmo que Artify esté certificado en ISO 27001. Lo que hago es usar la norma como referencia para ordenar el plan de respaldo.

| Enfoque de ISO 27001 | Aplicación en Artify |
| --- | --- |
| Gestión de riesgos | Identifico riesgos sobre la base, secretos y datos personales. |
| Control de acceso | Limito quién puede crear, ver y restaurar respaldos. |
| Información documentada | Registro políticas, comandos, responsables y pruebas. |
| Continuidad | Defino cómo recuperar Artify ante pérdida o daño de datos. |
| Mejora continua | Reviso el plan después de pruebas, incidentes o cambios de arquitectura. |

Desde mi punto de vista, el mayor aporte de ISO 27001 para esta evidencia es que me obliga a pensar en el respaldo como un proceso completo: no solo crear una copia, sino protegerla, probarla, controlar su acceso y mejorarla.

## Formato de registro de prueba

Registro la prueba más reciente en una tabla sencilla. El resultado siguiente
corresponde a PostgreSQL local y no debe confundirse con una restauración del
servicio administrado de Neon:

| Campo | Registro |
| --- | --- |
| Fecha de prueba | 2026-07-17 |
| Backup usado | Archivo temporal en formato personalizado generado por `pg_dump` |
| Base destino | Base local temporal con nombre único `artify_restore_*` |
| Responsable | Iván Darío Madrid Daza |
| Resultado técnico | 22 750 bytes restaurados; cinco tablas funcionales encontradas; dos migraciones aplicadas correctamente |
| Resultado funcional | Lectura y escritura transaccional correctas con rol restringido; creación/eliminación de objetos denegada |
| Observaciones | Base, rol y archivo temporales eliminados automáticamente al finalizar |

La prueba se reproduce desde la raíz con:

```bash
node scripts/verificar-respaldo-postgresql.js
```

El script solo acepta una conexión PostgreSQL local. Genera un respaldo, lo
restaura en una base temporal, aplica las migraciones, comprueba el rol de menor
privilegio y limpia todos los recursos creados. No reemplaza la verificación de
las capacidades del plan activo de Neon; esa comprobación queda registrada con
la tabla de revisión trimestral anterior.

## Conclusiones

Con este plan dejo definido cómo protegería los datos más importantes de Artify. Identifico como críticos los usuarios, secretos, operaciones, sesiones, configuraciones y scripts SQL porque permiten mantener la aplicación funcionando y recuperarla si ocurre un incidente.

También concluyo que una copia de seguridad no es suficiente por sí sola. Debo probar la restauración, controlar el acceso, cuidar las credenciales y registrar los resultados. Así convierto el backup en una práctica real de seguridad y no en un archivo olvidado.

Finalmente, este plan complementa la migración de Artify a PostgreSQL porque agrega una regla importante: antes de tocar datos o estructura de base de datos, debo contar con un respaldo verificable y un procedimiento claro de recuperación.

## Bibliografía

Asociación Española de Normalización. (2023). *UNE-EN ISO/IEC 27001:2023. Seguridad de la información, ciberseguridad y protección de la privacidad. Sistemas de gestión de la seguridad de la información. Requisitos*. UNE. https://www.une.org/

Instituto Nacional de Ciberseguridad. (s. f.). *Protege tu empresa*. INCIBE. Recuperado el 8 de julio de 2026, de https://www.incibe.es/empresas

International Organization for Standardization. (2022). *ISO/IEC 27001:2022. Sistemas de gestión de la seguridad de la información*. ISO. https://www.iso.org/es/norma/27001

Ministerio de Tecnologías de la Información y las Comunicaciones. (s. f.). *Modelo de Seguridad y Privacidad de la Información*. Gobierno Digital Colombia. Recuperado el 8 de julio de 2026, de https://gobiernodigital.mintic.gov.co/seguridadyprivacidad/

PostgreSQL Global Development Group. (s. f.). *PostgreSQL documentation: pg_dump and pg_restore*. Recuperado el 8 de julio de 2026, de https://www.postgresql.org/docs/
