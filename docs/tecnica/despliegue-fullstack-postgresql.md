# Guía de Despliegue Full-Stack de Artify con PostgreSQL

> **Proyecto:** Artify
> **Objetivo:** publicar una versión funcional de Artify con frontend estático, backend Node.js + Express y base de datos PostgreSQL.
> **Enfoque:** despliegue de prueba para validación técnica y evidencia académica.

## 1. Propósito de la guía

En esta guía describo el proceso que sigo para desplegar Artify de forma funcional en la web. A diferencia del despliegue estático, esta opción me permite probar registro, inicio de sesión, persistencia en base de datos, panel administrativo y registro de operaciones.

El resultado esperado es una aplicación distribuida en tres servicios:

- Netlify publica el frontend estático.
- Render ejecuta el backend Node.js + Express.
- Neon aloja PostgreSQL y conserva los datos.

Si no conozco estas herramientas, puedo entenderlas así:

| Herramienta | Qué representa en Artify | Qué dato importante me entrega |
| --- | --- | --- |
| Neon | El servidor PostgreSQL en la nube. | Una cadena `DATABASE_URL` para conectar Render con la base de datos. |
| Render | El servidor donde corre la API Node.js + Express. | Una URL pública del backend, por ejemplo `https://artify-sena-postgresql.onrender.com`. |
| Netlify | El servidor que publica los archivos del frontend. | Una URL pública del sitio, por ejemplo `https://artify-sena-postgresql.netlify.app`. |
| GitHub | El repositorio desde donde Render y Netlify leen el código. | La rama `main` con los commits que se van a desplegar. |

Esta guía no reemplaza la ejecución local. Antes de desplegar debo validar que el backend funciona localmente con PostgreSQL, porque los errores de código son más fáciles de corregir antes de configurar servicios externos.

Para organizar el despliegue, separo el proceso en tres servicios:

| Componente | Plataforma sugerida | Función |
| --- | --- | --- |
| Frontend | Netlify | Publicar los archivos HTML, CSS y JavaScript. |
| Backend | Render | Ejecuto Node.js + Express. |
| Base de datos | Neon PostgreSQL | Alojar la base de datos PostgreSQL. |

## 2. Consideraciones antes de iniciar

Antes de grabar el video de evidencia, realizo el proceso una vez como práctica. En esa primera ejecución identifico pantallas, tiempos de espera, errores comunes y valores que no debo mostrar en cámara.

### 2.1 Cuentas y accesos necesarios

Antes de iniciar confirmo que tengo acceso a:

| Servicio | Necesito |
| --- | --- |
| GitHub | Repositorio actualizado y rama `main` con los últimos commits. |
| Neon | Cuenta para crear proyecto PostgreSQL y obtener `DATABASE_URL`. |
| Render | Cuenta conectada a GitHub para publicar el backend. |
| Netlify | Cuenta conectada a GitHub para publicar el frontend. |
| Terminal local | `git`, `node`, `pnpm` y, si voy a cargar la base desde mi equipo, `psql`. |

### 2.2 Datos que debo preparar

Antes de abrir los paneles externos preparo estos valores:

| Valor | Uso | Ejemplo |
| --- | --- | --- |
| `TOKEN_SECRET` | Firma de tokens JWT. | secreto largo y privado |
| `DATABASE_URL` | Conexión Render -> Neon. | se copia desde Neon |
| `ARTIFY_API_URL` | Conexión Netlify -> Render. | URL pública del backend |
| `CORS_ORIGIN` | Origen permitido en backend. | URL pública del frontend |

`TOKEN_SECRET` y `DATABASE_URL` no deben quedar en capturas, commits, documentos públicos ni videos.

Para la grabación final evito:

- Mostrar contraseñas, tokens o cadenas completas de conexión.
- Abrir el archivo `.env` real si contiene secretos visibles.
- Publicar capturas donde aparezca la contraseña de la base de datos.

## 3. Flujo general del despliegue

```mermaid
flowchart LR
    A["Repositorio GitHub"] --> B["Netlify frontend"]
    A --> C["Render backend"]
    D["Neon PostgreSQL"] --> C
    B -->|ARTIFY_API_URL| C
    C -->|DATABASE_URL| D
```

El orden práctico es importante:

1. Valido el proyecto localmente.
2. Creo la base en Neon.
3. Cargo `schema.sql` y `seed.sql`.
4. Publico el backend en Render con `DATABASE_URL`.
5. Verifico `/health` y una ruta que consulte PostgreSQL.
6. Publico el frontend en Netlify con `ARTIFY_API_URL`.
7. Actualizo `CORS_ORIGIN` en Render con la URL real de Netlify.
8. Verifico el flujo completo desde navegador.

No conviene empezar por Netlify porque el frontend necesita conocer la URL pública del backend. Tampoco conviene desplegar Render antes de preparar Neon, porque el backend iniciaría sin conexión real a PostgreSQL.

## 4. Preparar el repositorio

Antes de configurar servicios externos, confirmo que el proyecto esté actualizado. Estos comandos se ejecutan en la terminal, desde la raíz del repositorio `artify`:

```bash
git status
git log --oneline -3
```

Si `git status` muestra archivos modificados, significa que tengo cambios locales que GitHub todavía no necesariamente conoce. Render y Netlify despliegan desde GitHub, no desde mi carpeta local. Por eso, si hay cambios pendientes, los reviso, los agrego y hago commit antes de desplegar:

```bash
git diff --stat
git add archivo-modificado
git commit -m "docs(despliegue): describir ajuste realizado"
git status
```

También confirmo que el backend pasa la validación. Estos comandos se ejecutan dentro de la carpeta `backend`:

```bash
cd backend
pnpm install
pnpm run check
pnpm test
```

Si mi terminal muestra un error indicando que `pnpm` requiere Node.js `22.13` o superior, debo corregir primero la versión de Node antes de instalar dependencias o ejecutar pruebas.

Si las pruebas dependen de una base local, debo tener PostgreSQL activo y el archivo `.env` configurado.

### 4.1 Verificación local mínima

Desde la raíz del repositorio confirmo que puedo preparar la base local cuando aplique:

```bash
psql -d artify_db -c "\\dt"
psql -d artify_db -c "\\dv"
```

Desde `backend/` confirmo que el entorno usa una versión compatible de Node:

```bash
node -v
pnpm -v
pnpm run check
pnpm test
```

El backend requiere Node.js `22.13` o superior para evitar incompatibilidades con la versión actual de `pnpm`. Si la terminal usa una versión anterior, priorizo Node 22 antes de instalar dependencias o ejecutar pruebas.

### 4.2 Subir cambios antes de conectar servicios

Render y Netlify despliegan desde GitHub. Por eso, antes de crear servicios confirmo que los commits ya están en remoto:

```bash
git status
git push origin main
```

Si no subo los cambios, los servicios externos pueden desplegar una versión anterior del proyecto.

## 5. Creo la Base de Datos en Neon

En Neon preparo primero la base de datos porque el backend de Render dependerá de la variable `DATABASE_URL`.

### 5.1 Crear el proyecto

1. Ingreso a Neon desde el navegador.
2. Inicio sesión con mi cuenta.
3. En el panel principal busco el botón **New Project**.
4. En **Project name** escribo un nombre identificable, por ejemplo `artify`.
5. En la versión de PostgreSQL selecciono `16`.
6. En región selecciono una ubicación cercana al backend que usaré en Render. Para esta práctica puede ser una región de Estados Unidos si Render está en Oregon u otra región cercana.
7. Reviso si Neon muestra una base inicial llamada `neondb`. Esa base puede usarse para la práctica.
8. Confirmo con **Create project** o el botón equivalente.
9. Espero a que Neon termine de crear el proyecto.

PostgreSQL 16 es una versión estable y compatible con el esquema de Artify. El proyecto no usa funciones específicas que obliguen a una versión superior, por lo que PostgreSQL 16 ofrece una base prudente para documentación, pruebas y despliegue.

Después de crear el proyecto, Neon suele abrir una pantalla con dos opciones:

- **Connect your app with one command**: asistente automático de Neon.
- **Connect your app manually**: datos manuales de conexión.

Para esta entrega uso **Connect your app manually**, porque necesito copiar de forma controlada la cadena `DATABASE_URL` y usarla después en Render.

### 5.2 Definir la base de datos activa

Neon puede crear una base inicial por defecto llamada `neondb`. Para Artify puedo usar esa base inicial o crear una base llamada:

```text
artify_db
```

Lo importante es que el nombre de la base en la cadena `DATABASE_URL` coincida con la base donde cargaré `schema.sql` y `seed.sql`.

Para no confundirme durante la primera práctica, recomiendo usar la base que Neon entrega por defecto si ya aparece seleccionada en el panel. En ese caso, la URL de conexión terminará en:

```text
/neondb
```

Si decido crear `artify_db`, debo asegurarme de seleccionar esa base en la ventana de conexión y de ejecutar ahí los scripts del proyecto.

### 5.3 Obtener la cadena de conexión

En el panel del proyecto abro la opción **Connect**. Neon muestra una ventana llamada **Connect to your database**. En esa ventana selecciono:

1. **Branch**: `production`.
2. **Compute**: `Primary`.
3. **Database**: `neondb` o la base que haya elegido para Artify.
4. **Role**: `neondb_owner` u otro rol creado para el proyecto.
5. **Connection string** como formato de salida.

El formato esperado es:

```env
postgresql://usuario:contrasena@host/dbname?sslmode=require
```

Para Render uso esta cadena como `DATABASE_URL`. En la ventana **Connect to your database** confirmo:

| Campo | Valor usado en Artify |
| --- | --- |
| Branch | `production` |
| Database | `neondb` o la base creada para Artify |
| Role | `neondb_owner` |
| Connection string | cadena completa PostgreSQL |

Neon puede mostrar la contraseña como asteriscos. Antes de copiar la cadena hago clic en **Show password** o uso directamente **Copy snippet** para copiar la cadena completa. No debo copiar una cadena que contenga `********`, porque Render no podrá autenticarse.

La cadena se copia completa, desde `postgresql://` hasta el final de los parámetros. No debo borrar `sslmode=require` ni `channel_binding=require` si Neon los incluye.

Si `Connection pooling` está desactivado, la cadena usa un host normal:

```env
postgresql://neondb_owner:contrasena_neon@host-neon.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Si `Connection pooling` está activado, la cadena usa un host con `-pooler`:

```env
postgresql://neondb_owner:contrasena_neon@host-neon-pooler.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Para este proyecto académico cualquiera de las dos opciones funciona. Lo importante es mantener una sola cadena consistente durante la configuración y pegarla completa en Render.

Antes de pegarla en Render verifico:

- Que incluya `sslmode=require`.
- Que incluya una contraseña real, no `********`.
- Que el nombre final de la ruta sea la base correcta, por ejemplo `/neondb` o `/artify_db`.
- Que no tenga espacios al inicio o al final.
- Que esté en una sola línea.
- Que no se muestre completa en capturas, videos o documentos versionados.

### 5.4 Criterios de seguridad

- No guardo la cadena real de Neon en el repositorio.
- No la copio en `README.md`, documentos o evidencias visibles.
- Si la cadena se expone durante una práctica o grabación, genero una nueva contraseña o una nueva cadena desde Neon antes del despliegue final.

La contraseña dentro de `DATABASE_URL` pertenece al rol PostgreSQL de Neon. No es una contraseña de usuario de Artify. Los usuarios de Artify se autentican desde `login.html` contra la tabla `"USUARIO"`.

## 6. Creo las Tablas en PostgreSQL

Con la base creada, debo cargar dos archivos del proyecto:

| Archivo | Qué hace |
| --- | --- |
| `database/postgresql/schema.sql` | Crea tablas, índices, vista y estructura PostgreSQL. |
| `database/postgresql/seed.sql` | Inserta datos de referencia iniciales. |

El orden es obligatorio: primero `schema.sql` y después `seed.sql`.

### 6.1 Opción A: cargar los scripts desde la terminal con `psql`

Uso esta opción si tengo `psql` instalado en mi equipo. Los comandos se ejecutan desde la raíz del repositorio `artify`, no desde `backend/`:

```bash
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -f database/postgresql/schema.sql
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -f database/postgresql/seed.sql
```

Reemplazo la cadena de ejemplo por la connection string real de Neon. Si la cadena contiene caracteres especiales, la dejo entre comillas dobles como aparece en el ejemplo.

Este paso corresponde al aprovisionamiento inicial o a un reinicio controlado de la base. El archivo `schema.sql` elimina y vuelve a crear los objetos del proyecto; por eso no debo ejecutarlo sobre una base con información útil sin realizar primero una copia de seguridad.

Después verifico que existan las tablas y la vista:

```bash
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -c "\\dt"
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -c "\\dv"
```

En la práctica evito mostrar la cadena completa en capturas o videos.

Resultado esperado:

- `USUARIO`
- `CONFIGURACION`
- `IMAGEN`
- `SESION_EDICION`
- `OPERACION`
- `v_usuarios_activos`

También puedo hacer una verificación mínima de datos:

```bash
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -c 'SELECT COUNT(*) FROM "USUARIO";'
```

### 6.2 Opción B: cargar los scripts desde el editor SQL de Neon

Uso esta opción si no tengo `psql` disponible en mi equipo.

1. Abro el proyecto en Neon.
2. En el menú lateral de Neon entro a **SQL Editor**.
3. Confirmo que arriba esté seleccionada la branch `production`.
4. Confirmo que la base seleccionada sea `neondb` o la base elegida para Artify.
5. En mi editor local abro `database/postgresql/schema.sql`.
6. Copio todo el contenido de `schema.sql`.
7. Pego el contenido en el editor SQL de Neon.
8. Hago clic en **Run**.
9. Espero a que Neon muestre que las consultas terminaron correctamente.
10. Limpio el editor o abro una nueva consulta.
11. Abro `database/postgresql/seed.sql`.
12. Copio todo el contenido de `seed.sql`.
13. Lo pego en el editor SQL de Neon.
14. Hago clic en **Run**.
15. Verifico tablas y vista con consultas equivalentes:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```

También puedo verificar desde Neon con los meta-comandos de PostgreSQL:

```sql
\dt
\dv
```

Si Neon muestra errores al ejecutar `seed.sql`, normalmente significa que no ejecuté primero `schema.sql` o que lo ejecuté en otra base.

### 6.3 Promover un Usuario a Administrador

El panel administrativo no usa variables de entorno propias para correo o contraseña en Render. El administrador es un usuario real de Artify almacenado en PostgreSQL con `usr_rol = 'admin'`.

El proceso recomendado es:

1. Termino de desplegar backend y frontend.
2. Registro un usuario desde el frontend publicado en Netlify.
3. Promuevo ese correo a administrador en Neon.
4. Inicio sesión desde `login.html` con el mismo correo y contraseña.

Si tengo `psql` en mi equipo, ejecuto desde la raíz del repositorio:

```bash
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -v correo='admin@artify.com' -f database/postgresql/promote-admin.sql
```

Si lo hago desde **Neon -> SQL Editor**, ejecuto una consulta equivalente:

```sql
UPDATE "USUARIO"
SET "usr_rol" = 'admin'
WHERE "usr_correo" = 'admin@artify.com';

SELECT "usr_id_usuario", "usr_correo", "usr_estado_usuario", "usr_rol"
FROM "USUARIO"
WHERE "usr_correo" = 'admin@artify.com';
```

El resultado debe mostrar `usr_rol = admin`. Desde ese momento, el login principal redirige a ese usuario al CRUD administrativo. Los usuarios con `usr_rol = usuario` siguen entrando al editor.

## 7. Desplegar el backend en Render

En Render publico primero el backend porque Netlify necesita conocer la URL pública de la API.

### 7.1 Crear el servicio web

1. Ingreso a Render desde el navegador.
2. Inicio sesión con mi cuenta.
3. En el panel principal selecciono **New**.
4. Selecciono **Web Service**.
5. Render pedirá conectar un repositorio. Elijo GitHub como proveedor.
6. Si Render solicita autorización, autorizo el acceso al repositorio.
7. Busco y selecciono el repositorio `artify`.
8. Confirmo que Render usará la rama `main`.
9. Avanzo a la pantalla de configuración del servicio.

### 7.2 Configurar build y arranque

En la pantalla de configuración del servicio lleno estos campos:

| Campo | Valor |
| --- | --- |
| Name | `artify-sena-postgresql` |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `pnpm install --frozen-lockfile` |
| Start Command | `pnpm start` |
| Branch | `main` |
| Health Check Path | `/health` |

El valor crítico es `Root Directory = backend`. Si dejo la raíz del repositorio como directorio del servicio, Render intentará instalar dependencias desde el lugar equivocado y el backend no iniciará correctamente.

No escribo `backend/pnpm start` ni `cd backend` en el Start Command. Como `Root Directory` ya es `backend`, Render ejecuta los comandos desde esa carpeta.

### 7.3 Configurar variables de entorno

En la misma pantalla de creación del servicio busco la sección **Environment Variables**. Ahí agrego las variables del backend una por una.

No uso `backend/.env` en Render. Ese archivo es local y puede tener valores de mi computador. En Render cada valor se declara desde el panel.

Variables de entorno mínimas del backend en producción:

```env
DATABASE_URL=postgresql://usuario:contrasena@host/dbname?sslmode=require
TOKEN_SECRET=secreto_largo_y_seguro
NODE_VERSION=22.13.0
NODE_ENV=production
CORS_ORIGIN=https://url-del-frontend.netlify.app
```

Durante el primer despliegue todavía no tengo la URL final de Netlify. Para no bloquear el backend, puedo usar un valor temporal en `CORS_ORIGIN` y actualizarlo después:

```env
CORS_ORIGIN=https://pendiente.netlify.app
```

Cuando Netlify entregue la URL real del frontend, vuelvo a Render, actualizo `CORS_ORIGIN` y reinicio o redespliego el servicio.

### 7.3.1 Reglas para diligenciar variables en Render

En Render agrego las variables una por una con **Add Environment Variable**:

1. Selecciono **Add Environment Variable**.
2. En **Key** escribo el nombre de la variable, por ejemplo `DATABASE_URL`.
3. En **Value** pego el valor correspondiente.
4. Repito el proceso para cada variable.

No uso **Add from .env** si mi `.env` contiene datos locales, porque podría subir a Render valores que solo sirven en mi computador.

| Variable | Qué valor debe llevar | Observación |
| --- | --- | --- |
| `DATABASE_URL` | Connection string completa copiada desde Neon. | No va entre comillas y no debe contener `********`. |
| `TOKEN_SECRET` | Texto largo aleatorio para firmar tokens. | Puede generarse con `openssl rand -hex 32`. |
| `NODE_VERSION` | `22.13.0` | Compatible con `pnpm` y el backend. |
| `NODE_ENV` | `production` | Debe escribirse exactamente así. |
| `CORS_ORIGIN` | URL del frontend. | Temporalmente uso `https://pendiente.netlify.app`. |

Si escribo `NODE_ENV=porduction` u otro valor con error tipográfico, el backend puede iniciar, pero el entorno quedará mal identificado. Debo corregirlo a `production`, guardar y redeployar.

Si Render muestra `password authentication failed for user 'neondb_owner'`, significa que la contraseña dentro de `DATABASE_URL` no corresponde a Neon. En ese caso copio de nuevo la connection string desde Neon con **Show password** o **Copy snippet** y reemplazo todo el valor de `DATABASE_URL`.

Si Render muestra `getaddrinfo ENOTFOUND base`, significa que el backend intenta conectarse a un host inválido llamado `base`. En ese caso reviso que `DATABASE_URL` sea la cadena completa de Neon y elimino variables separadas como `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` o `DB_NAME` si fueron agregadas con valores incorrectos.

Si necesito corregir una variable después de crear el servicio:

1. Entro al servicio **artify-sena-postgresql** en Render.
2. Abro **Environment** en el menú lateral.
3. Busco la variable.
4. Edito su valor.
5. Guardo con una opción que redespliegue, como **Save and deploy**.

Notas:

- `DATABASE_URL` es la variable principal para conectar con Neon.
- Las variables separadas `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` se reservan para configuración local o entornos donde no se use una cadena completa.
- Defino `TOKEN_SECRET` como un valor largo y no lo comparto.
- Render asigna el puerto mediante `PORT`; no necesito declararlo manualmente en el panel.
- `NODE_VERSION` fija una versión compatible con `backend/package.json` y `backend/.node-version`.
- Si todavía no conozco la URL de Netlify, dejo `CORS_ORIGIN` pendiente y lo actualizo al finalizar el despliegue del frontend.
- Render asigna una URL pública al backend cuando el despliegue finaliza.

### 7.4 Ejecutar el despliegue

Después de guardar la configuración:

1. Selecciono **Create Web Service**.
2. Espero a que Render ejecute el build.
3. Reviso los logs del despliegue en la misma pantalla de Render.
4. Confirmo que aparezca la instalación con `pnpm install --frozen-lockfile`.
5. Confirmo que el proceso ejecute `pnpm start`.
6. Confirmo que aparezca un mensaje de servidor corriendo.
7. Copio la URL pública del servicio, con formato similar a:

```text
https://artify-sena-postgresql.onrender.com
```

No agrego `/api` a esta URL base. Las rutas se agregan desde el frontend y desde las pruebas manuales.

Si Render muestra **Build successful** pero luego aparece un error de PostgreSQL, el servicio puede estar vivo pero con mala conexión a Neon. En ese caso no avanzo a Netlify hasta corregir `DATABASE_URL` y validar una ruta que consulte la base de datos.

## 8. Verificar el backend publicado

Cuando Render termine el despliegue, no asumo que todo funciona solo porque Render diga que el servicio está en vivo. Primero verifico dos rutas.

La primera ruta es `/health`. Esta ruta confirma que Express inició:

```text
https://url-del-backend.onrender.com/health
```

Resultado esperado:

```json
{
  "ok": true,
  "servicio": "artify-api"
}
```

Esta prueba confirma que Express inició correctamente. Después pruebo una ruta pública de analytics, que sí consulta PostgreSQL y confirma que Render puede conectarse a Neon:

También puedo usar `/ready` como verificación directa de PostgreSQL:

```text
https://url-del-backend.onrender.com/ready
```

`/ready` responde HTTP `200` cuando PostgreSQL está disponible y HTTP `503` cuando la conexión falla.

```text
https://url-del-backend.onrender.com/api/v1/analytics/filtros-populares
```

Resultado esperado:

```json
{
  "ok": true,
  "mensaje": "Top filtros utilizados"
}
```

Esta segunda prueba confirma que Render puede conectarse a Neon y que `schema.sql` ya fue cargado.

Puedo hacer estas pruebas de dos formas:

- Desde el navegador, pegando cada URL en la barra de direcciones.
- Desde la terminal con `curl`, si quiero ver la respuesta como texto.

Ejemplo:

```bash
curl https://artify-sena-postgresql.onrender.com/health
curl https://artify-sena-postgresql.onrender.com/ready
curl https://artify-sena-postgresql.onrender.com/api/v1/analytics/filtros-populares
```

Si la respuesta de analytics muestra `"filtros":[]`, eso no es un error. Significa que la tabla existe, la consulta funciona, pero todavía no hay operaciones registradas por usuarios.

### 8.1 Orden de diagnóstico

Si algo falla, reviso en este orden:

| Resultado | Interpretación | Acción |
| --- | --- | --- |
| `/health` no responde | El servicio no inició o Render falló en build/start. | Revisar logs, `Root Directory`, comandos y `NODE_VERSION`. |
| `/health` responde pero `/ready` falla | Express está activo, pero PostgreSQL no está disponible. | Revisar `DATABASE_URL`, Neon y conectividad. |
| `/health` responde pero analytics falla | Express está vivo, pero falla la conexión o el esquema PostgreSQL. | Revisar `DATABASE_URL`, carga de `schema.sql` y disponibilidad de Neon. |
| Render muestra error de módulo no encontrado | Dependencias no instaladas desde `backend`. | Confirmar `Root Directory = backend` y `Build Command`. |
| Render inicia pero luego se detiene | Error de arranque o variable faltante. | Revisar logs de runtime y variables obligatorias. |

Antes de avanzar a Netlify debo tener estas dos URLs funcionando:

```text
https://url-del-backend.onrender.com/health
https://url-del-backend.onrender.com/api/v1/analytics/filtros-populares
```

## 9. Desplegar el frontend en Netlify

El proyecto ya incluye `netlify.toml` en la raíz del repositorio con esta configuración:

```toml
[build]
  command = "node scripts/write-frontend-config.js"
  publish = "frontend"
```

### 9.1 Crear el sitio en Netlify

1. Ingreso a Netlify.
2. En el panel principal selecciono **Add new project** o **Add new site**.
3. Selecciono **Import an existing project**.
4. Elijo **Deploy with GitHub** como proveedor.
5. Autorizo Netlify si GitHub lo solicita.
6. Selecciono el repositorio `artify`.
7. En la pantalla de configuración del deploy confirmo la rama `main`.
8. Mantengo la raíz del repositorio como base del proyecto.
9. No configuro `frontend` como base directory, porque `netlify.toml` ya indica que se publica la carpeta `frontend`.

Configuración esperada:

| Campo | Valor |
| --- | --- |
| Base directory | vacío o raíz del repositorio |
| Build command | `node scripts/write-frontend-config.js` |
| Publish directory | `frontend` |
| Branch | `main` |

Si Netlify lee `netlify.toml`, puede mostrar automáticamente el build command y el publish directory. Si los muestra vacíos, los ingreso manualmente con los valores de la tabla.

### 9.2 Configurar la URL del backend

Antes de lanzar o repetir el despliegue del frontend, configuro la variable `ARTIFY_API_URL` en Netlify. Esta variable no se configura en Render, sino en el sitio frontend de Netlify.

Si todavía estoy en la pantalla inicial de creación del sitio:

1. Busco la sección **Environment variables**.
2. Selecciono **Add environment variable**.
3. En **Key** escribo:

```text
ARTIFY_API_URL
```

4. En **Value** escribo la URL base del backend de Render:

```text
https://artify-sena-postgresql.onrender.com
```

5. Guardo la variable.
6. Continúo con **Deploy** o **Deploy site**.

Si el sitio ya fue creado y necesito agregar o corregir la variable:

1. Entro al sitio en Netlify.
2. Abro **Site configuration**.
3. Entro a **Environment variables**.
4. Selecciono **Add a variable**.
5. En **Key** escribo `ARTIFY_API_URL`.
6. En **Value** escribo `https://artify-sena-postgresql.onrender.com`.
7. Guardo los cambios.
8. Voy a **Deploys**.
9. Selecciono **Trigger deploy**.
10. Selecciono **Deploy site** para que Netlify regenere `frontend/assets/js/config.js`.

El valor esperado para esta entrega es:

```env
ARTIFY_API_URL=https://artify-sena-postgresql.onrender.com
```

No agrego `/api` al final porque el código ya construye las rutas completas. Tampoco agrego barra final; uso la URL base exacta del backend.

El script `scripts/write-frontend-config.js` lee `ARTIFY_API_URL` y genera `frontend/assets/js/config.js` durante el build. Por eso, si cambio esta variable en Netlify, debo ejecutar un nuevo deploy para que el frontend tome el nuevo backend.

Durante el deploy reviso los logs y busco una línea similar a:

```text
Configuración frontend generada en .../frontend/assets/js/config.js
```

Esa línea confirma que Netlify ejecutó el script que escribe la URL del backend.

### 9.3 Publicar y tomar la URL final

Después de guardar la variable:

1. Ejecuto el deploy en Netlify.
2. Espero a que el build termine con estado **Published**.
3. Abro la URL pública que entrega Netlify con **Open production deploy** o **Visit site**.
4. Copio la URL final del sitio, por ejemplo:

```text
https://artify-sena-postgresql.netlify.app
```

Esta URL final de Netlify será el valor que después debo copiar en `CORS_ORIGIN` dentro de Render.

### 9.4 Actualizar CORS en Render

Cuando Netlify entregue la URL pública del frontend, debo regresar a Render para permitir que ese frontend pueda consumir el backend. Este paso se llama configuración de CORS.

En términos prácticos:

- Netlify aloja la interfaz que ve el usuario.
- Render aloja la API.
- El navegador solo permitirá que Netlify llame a Render si el backend tiene autorizada la URL de Netlify en `CORS_ORIGIN`.

Por eso debo cambiar el valor temporal:

```env
CORS_ORIGIN=https://pendiente.netlify.app
```

por la URL real que Netlify me entregó.

Para hacerlo en Render:

1. Ingreso a Render.
2. En el panel principal busco la lista de servicios.
3. Abro el servicio del backend, por ejemplo **artify-sena-postgresql**.
4. Verifico que estoy dentro del servicio correcto mirando la URL pública del backend, por ejemplo:

```text
https://artify-sena-postgresql.onrender.com
```

5. En el menú lateral izquierdo del servicio selecciono **Environment**.
6. Bajo hasta la sección **Environment Variables**.
7. Busco la variable `CORS_ORIGIN`.
8. Si la variable ya existe, edito su valor.
9. Si la variable no existe, selecciono **Add Environment Variable** y la creo.
10. En **Key** escribo:

```text
CORS_ORIGIN
```

11. En **Value** pego la URL final de Netlify, sin barra final:

```text
https://url-del-frontend.netlify.app
```

Ejemplo:

```env
CORS_ORIGIN=https://artify-sena-postgresql.netlify.app
```

12. Guardo los cambios.
13. Si Render muestra varias opciones de guardado, selecciono una opción que redespliegue el servicio, por ejemplo **Save and deploy** o **Save, rebuild, and deploy**.
14. Espero a que el deploy termine correctamente.
15. Vuelvo a probar el backend en:

```text
https://artify-sena-postgresql.onrender.com/health
```

16. Abro el frontend de Netlify y pruebo registro o login.

No debo colocar la URL de Render en `CORS_ORIGIN`. En `CORS_ORIGIN` va la URL del frontend de Netlify, porque ese es el origen desde donde saldrán las peticiones del navegador.

Si durante la práctica uso más de un origen, puedo separarlos por coma:

```env
CORS_ORIGIN=https://url-del-frontend.netlify.app,http://localhost:8080
```

Para la entrega pública dejo principalmente la URL real de Netlify. Solo mantengo `localhost` si necesito seguir probando desde mi equipo.

Si después de cambiar `CORS_ORIGIN` el frontend sigue mostrando error CORS, reviso:

- Que la URL de Netlify esté escrita completa, con `https://`.
- Que no tenga barra final.
- Que no haya espacios antes o después.
- Que guardé los cambios con una opción que redespliegue Render.
- Que el frontend realmente esté llamando a `https://artify-sena-postgresql.onrender.com` mediante `ARTIFY_API_URL`.

## 10. Verificar el frontend publicado

Después del despliegue en Netlify y de actualizar `CORS_ORIGIN` en Render, realizo estas pruebas en este orden:

| Prueba | Resultado esperado |
| --- | --- |
| Abrir página principal | Confirmo que la interfaz carga correctamente. |
| Abrir registro | Confirmo que el formulario se muestra sin errores. |
| Registrar usuario | Confirmo que el usuario queda creado en PostgreSQL. |
| Iniciar sesión | Confirmo que el sistema entrega token y abre el editor. |
| Abrir editor | Confirmo que puedo cargar una imagen. |
| Registrar operación | Confirmo que el backend guarda la operación. |
| Entrar como administrador | Confirmo que el panel lista usuarios registrados. |

### 10.1 Verificación desde el navegador

En el navegador abro las herramientas de desarrollo y reviso la pestaña **Network**. En la mayoría de navegadores puedo hacerlo con clic derecho sobre la página y luego **Inspeccionar**, o con `F12` si el teclado lo permite.

- Las peticiones deben apuntar a `https://url-del-backend.onrender.com`.
- No deben aparecer errores CORS.
- Las respuestas de login y registro deben ser `200`, `201`, `400` o `401` según el caso probado, no errores de red.
- Si aparece `Failed to fetch`, reviso `ARTIFY_API_URL` en Netlify y `CORS_ORIGIN` en Render.

Para validar que Netlify tomó la URL correcta del backend, puedo abrir en el navegador:

```text
https://url-del-frontend.netlify.app/assets/js/config.js
```

El archivo debe mostrar una línea similar a:

```js
window.ARTIFY_API_URL = "https://artify-sena-postgresql.onrender.com";
```

Si aparece vacío o muestra una URL antigua, debo corregir `ARTIFY_API_URL` en Netlify y ejecutar un nuevo deploy.

### 10.2 Verificación en Neon

Después de registrar un usuario desde el frontend publicado, verifico en Neon que el dato llegó a PostgreSQL. Puedo usar `psql` o el editor SQL de Neon:

```sql
SELECT usr_id_usuario, usr_correo, usr_fecha_registro
FROM "USUARIO"
ORDER BY usr_id_usuario DESC
LIMIT 5;
```

Con esto confirmo el flujo completo:

```text
Netlify frontend -> Render backend -> Neon PostgreSQL
```

### 10.3 Validación del despliegue actual

Para esta entrega validé nuevamente el despliegue público el **9 de julio de 2026** con estas URLs activas:

| Servicio | URL |
| --- | --- |
| Frontend Netlify | `https://artify-sena-postgresql.netlify.app` |
| Backend Render | `https://artify-sena-postgresql.onrender.com` |

Resultados de validación:

| Validación | Comando o ruta | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- |
| Frontend publicado | `https://artify-sena-postgresql.netlify.app/` | HTTP `200` | Correcto |
| Configuración frontend | `/assets/js/config.js` | `window.ARTIFY_API_URL` apunta a Render | Correcto |
| Salud backend | `/health` | `ok: true`, entorno `production` | Correcto |
| Consulta PostgreSQL | `/api/v1/analytics/filtros-populares` | Respuesta `ok: true` | Correcto |
| CORS desde Netlify | `OPTIONS /api/login` con origen Netlify | `access-control-allow-origin` igual a Netlify | Pendiente de revalidación manual |
| Login inválido controlado | `POST /api/login` con correo inválido | Respuesta JSON de validación | Pendiente de revalidación manual |
| Cambio visual reciente | CSS publicado de `index.css` | Fondo principal negro | Correcto |

La respuesta de analytics puede mostrar:

```json
{
  "filtros": []
}
```

Esto no es un error. Significa que la ruta consulta PostgreSQL correctamente, pero todavía no hay operaciones de edición registradas.

El login inválido controlado no prueba credenciales reales. Solo confirma que el frontend puede llegar al backend y que el backend responde con JSON. Las credenciales reales se validan aparte:

- Usuarios normales: se crean desde `registro.html` y luego ingresan por `login.html`.
- Administrador: se crea como usuario normal, se promueve en PostgreSQL con rol `admin` y luego ingresa por `login.html`. Si el rol es `admin`, el frontend lo envía al CRUD.

## 11. Guía para practicar antes del video

La primera práctica sirve para confirmar que el procedimiento es repetible y para identificar en qué pantallas aparecen secretos. No uso esta práctica como evidencia final si durante el proceso se muestran contraseñas, tokens o cadenas completas.

### 11.1 Ensayo técnico

1. Confirmo que `main` está actualizado en GitHub.
2. Creo el proyecto en Neon.
3. Selecciono PostgreSQL `16`.
4. Confirmo la base de Neon que usaré, por ejemplo `neondb` o `artify_db`.
5. Copio `DATABASE_URL` sin mostrarla en pantalla.
6. Ejecuto `schema.sql`.
7. Ejecuto `seed.sql`.
8. Verifico tablas, vista y conteo básico.
9. Creo el servicio backend en Render.
10. Configuro `Root Directory`, comandos y variables.
11. Espero el primer deploy del backend.
12. Verifico `/health`.
13. Verifico `/api/v1/analytics/filtros-populares`.
14. Creo el sitio frontend en Netlify.
15. Configuro `ARTIFY_API_URL`.
16. Ejecuto el deploy del frontend.
17. Copio la URL pública de Netlify.
18. Actualizo `CORS_ORIGIN` en Render.
19. Reinicio o redespliego el backend.
20. Registro un usuario administrativo de prueba.
21. Promuevo ese usuario a rol `admin` en Neon.
22. Pruebo login, editor y panel admin.

### 11.1.1 Ensayo con las URLs de esta entrega

Para esta entrega uso estos valores públicos:

```env
ARTIFY_API_URL=https://artify-sena-postgresql.onrender.com
CORS_ORIGIN=https://artify-sena-postgresql.netlify.app
```

Antes de grabar confirmo:

1. En Netlify, `ARTIFY_API_URL` tiene el valor de Render.
2. En Render, `CORS_ORIGIN` tiene el valor de Netlify sin barra final.
3. El archivo público `https://artify-sena-postgresql.netlify.app/assets/js/config.js` muestra la URL de Render.
4. `https://artify-sena-postgresql.onrender.com/health` responde `ok: true`.
5. `https://artify-sena-postgresql.onrender.com/api/v1/analytics/filtros-populares` responde `ok: true`.
6. Puedo registrar un usuario nuevo desde Netlify.
7. Puedo iniciar sesión con ese usuario.
8. Puedo promover un usuario a `admin` en Neon y entrar al panel desde el login principal.

Si el login muestra **Error al conectar con el servidor**, reviso `ARTIFY_API_URL` y `CORS_ORIGIN`.

Si el login muestra **Credenciales incorrectas**, la conexión ya funciona y debo revisar el correo/contraseña usado.

### 11.2 Registro de observaciones

Durante la práctica anoto:

| Dato | Para qué sirve |
| --- | --- |
| URL de Render | Configurar `ARTIFY_API_URL` en Netlify. |
| URL de Netlify | Configurar `CORS_ORIGIN` en Render. |
| Tiempo aproximado de build Render | Preparar pausas del video. |
| Tiempo aproximado de build Netlify | Preparar pausas del video. |
| Errores encontrados | Explicar correcciones sin improvisar. |
| Pantallas con secretos | Evitarlas o cubrirlas durante la evidencia. |

### 11.3 Condiciones para grabar la evidencia final

Solo grabo la evidencia final cuando:

- El backend publicado responde `/health`.
- La ruta de analytics responde desde Render.
- El frontend publicado carga desde Netlify.
- `CORS_ORIGIN` ya contiene la URL real de Netlify.
- Puedo registrar o iniciar sesión con un usuario de prueba.
- El panel administrativo lista usuarios.
- No necesito abrir pantallas con secretos visibles.

Durante la práctica puedo pausar, revisar logs y corregir variables. Durante el video muestro el proceso ya conocido y oculto secretos.

## 12. Repetir o eliminar el despliegue

Puedo hacer un despliegue de prueba, eliminarlo y repetirlo. Esto es útil para validar que la guía funciona desde cero, pero debo entender qué se pierde al borrar cada servicio.

### 12.1 Qué ocurre si elimino servicios

| Servicio eliminado | Qué se pierde | Qué debo repetir |
| --- | --- | --- |
| Neon | Base, tablas y datos. | Crear proyecto/base, cargar `schema.sql` y `seed.sql`, copiar nuevo `DATABASE_URL`. |
| Render | URL del backend y variables del servicio. | Crear servicio, configurar variables y actualizar `ARTIFY_API_URL` en Netlify. |
| Netlify | URL del frontend y configuración del sitio. | Crear sitio, configurar `ARTIFY_API_URL` y actualizar `CORS_ORIGIN` en Render. |

Si elimino y recreo Render o Netlify, las URLs públicas pueden cambiar. Cada cambio de URL obliga a revisar las variables cruzadas:

- Si cambia Render, actualizo `ARTIFY_API_URL` en Netlify y redepliego frontend.
- Si cambia Netlify, actualizo `CORS_ORIGIN` en Render y reinicio backend.
- Si cambia Neon, actualizo `DATABASE_URL` en Render y reinicio backend.

### 12.2 Limpieza antes de repetir

Antes de repetir el despliegue verifico:

1. Que no voy a borrar una base con datos útiles.
2. Que tengo los scripts `schema.sql` y `seed.sql` actualizados.
3. Que el repositorio remoto contiene los últimos commits.
4. Que tengo a mano `TOKEN_SECRET`.
5. Que no reutilizo una cadena `DATABASE_URL` de una base eliminada.

### 12.3 Dónde corregir cada configuración

Si no quiero borrar servicios y solo necesito corregir una configuración, uso esta guía rápida:

| Necesito corregir | Dónde entro | Qué cambio |
| --- | --- | --- |
| Cadena de PostgreSQL | Render -> servicio backend -> **Environment** | `DATABASE_URL` |
| Secreto de tokens | Render -> servicio backend -> **Environment** | `TOKEN_SECRET` |
| URL permitida del frontend | Render -> servicio backend -> **Environment** | `CORS_ORIGIN` |
| URL del backend usada por el frontend | Netlify -> sitio frontend -> **Site configuration** -> **Environment variables** | `ARTIFY_API_URL` |
| Esquema, datos iniciales o rol admin | Neon -> proyecto -> **SQL Editor** o `psql` | ejecutar `schema.sql`, `seed.sql` o `promote-admin.sql` según corresponda |
| Código backend | GitHub y luego Render | commit, push y redeploy |
| Código frontend | GitHub y luego Netlify | commit, push y deploy |

### 12.4 Repetición controlada sin eliminar servicios

Si solo quiero corregir configuración, no necesito borrar todo:

| Cambio | Acción suficiente |
| --- | --- |
| Cambié documentación o backend | Commit, push y redeploy en Render si afecta backend. |
| Cambié frontend o `ARTIFY_API_URL` | Redeploy en Netlify. |
| Cambié `CORS_ORIGIN` | Reiniciar o redeployar Render. |
| Cambié esquema de base | Ejecutar `schema.sql` y `seed.sql` con cuidado, sabiendo que `schema.sql` recrea objetos. |

## 13. Guion breve para el video

1. Presento el objetivo: publicar Artify con frontend, backend y PostgreSQL.
2. Muestro el repositorio y la estructura general.
3. Muestro que el backend fue validado localmente, sin abrir `.env`.
4. Muestro la base en Neon sin exponer la contraseña.
5. Explico que cargué `schema.sql` y `seed.sql`.
6. Muestro Render con el backend desplegado.
7. Verifico `/health` y una ruta pública de la API.
8. Muestro Netlify con `ARTIFY_API_URL` configurado.
9. Muestro que `CORS_ORIGIN` quedó actualizado con la URL del frontend.
10. Abro la URL pública del frontend.
11. Registro o inicio sesión con un usuario de prueba.
12. Abro el editor y realizo una prueba básica.
13. Verifico en Neon que el usuario de prueba quedó registrado.
14. Concluyo explicando que la aplicación quedó funcional en la web.

### 13.1 Guion detallado de pantallas para no mostrar secretos

Para grabar la evidencia sin exponer credenciales:

1. Muestro GitHub con el repositorio y la rama `main`.
2. Muestro Neon solo en la vista general del proyecto o tablas, sin abrir la cadena completa de conexión.
3. Muestro Render en el servicio `artify-sena-postgresql`.
4. En Render puedo mostrar nombres de variables, pero oculto valores sensibles como `DATABASE_URL` y `TOKEN_SECRET`.
5. Muestro que `CORS_ORIGIN` apunta a Netlify, sin mostrar otros secretos.
6. Muestro Netlify con el sitio `artify-sena-postgresql`.
7. Muestro que `ARTIFY_API_URL` apunta a Render.
8. Abro `https://artify-sena-postgresql.netlify.app/assets/js/config.js` para evidenciar que el frontend tomó el backend correcto.
9. Abro `https://artify-sena-postgresql.onrender.com/health` para evidenciar que el backend está activo.
10. Abro `https://artify-sena-postgresql.onrender.com/api/v1/analytics/filtros-populares` para evidenciar conexión con PostgreSQL.
11. Registro un usuario de prueba desde el frontend.
12. Inicio sesión con ese usuario.
13. Realizo una operación básica en el editor.
14. Muestro en Neon una consulta de verificación del usuario u operación, evitando exponer contraseñas o cadenas de conexión.

## 14. Problemas comunes

| Problema | Causa probable | Solución |
| --- | --- | --- |
| Error de conexión a PostgreSQL | `DATABASE_URL` incorrecta o sin SSL. | Copio nuevamente la cadena desde Neon. |
| `password authentication failed for user 'neondb_owner'` | La contraseña dentro de `DATABASE_URL` no es la contraseña real de Neon. | Copiar la connection string completa desde Neon con **Show password** o **Copy snippet** y reemplazar todo `DATABASE_URL` en Render. |
| `getaddrinfo ENOTFOUND base` | Render recibió un host inválido, normalmente por `DATABASE_URL` mal pegada o variables `DB_*` incorrectas. | Pegar la cadena completa de Neon en `DATABASE_URL` y eliminar `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` si no se usan. |
| `DATABASE_URL` contiene `********` | Copié la cadena desde Neon sin mostrar la contraseña. | Usar **Show password** o **Copy snippet** antes de copiar. |
| `/health` muestra `entorno: porduction` | `NODE_ENV` quedó mal escrito. | Cambiar `NODE_ENV` a `production`, guardar y redeployar. |
| `/health` responde pero analytics falla | No ejecuté `schema.sql` o la base no está disponible. | Verifico Neon, cargo el esquema inicial y reviso `DATABASE_URL`. |
| `/health` no responde | El servicio Express no inició o Render falló en build/start. | Revisar logs, `Root Directory`, `Build Command`, `Start Command` y versión de Node. |
| Render despliega desde la raíz incorrecta | `Root Directory` no está en `backend`. | Cambiar `Root Directory` a `backend` y redeployar. |
| Render no reconoce pnpm | Build mal configurado o runtime incompatible. | Usar `pnpm install --frozen-lockfile` y definir `NODE_VERSION`. |
| Backend se queda sin permisos CORS | `CORS_ORIGIN` no coincide exactamente con Netlify. | Copiar la URL final de Netlify sin barra final y reiniciar Render. |
| Login no responde desde Netlify | `ARTIFY_API_URL` no apunta al backend correcto. | Reviso la variable en Netlify y ejecuto un nuevo despliegue. |
| Frontend sigue llamando una URL antigua | Netlify no regeneró `config.js`. | Ejecutar nuevo deploy después de cambiar `ARTIFY_API_URL`. |
| Error CORS | `CORS_ORIGIN` no incluye la URL pública del frontend. | Agrego la URL de Netlify en `CORS_ORIGIN` y redespliego el backend. |
| Usuario duplicado en pruebas | Repetí correo o cédula. | Uso datos nuevos de prueba. |
| Base vacía en Neon | Solo creé el proyecto, pero no cargué scripts. | Ejecutar `schema.sql` y luego `seed.sql`. |
| Error al ejecutar `seed.sql` | No se ejecutó primero `schema.sql`. | Cargar el esquema y después los datos de referencia. |
| Variables visibles en pantalla | Abrí un panel con secretos. | Detengo la grabación y repito ocultando valores. |

## 15. Referencias

- Netlify Docs. File-based configuration: https://docs.netlify.com/build/configure-builds/file-based-configuration/
- Netlify Docs. Build environment variables: https://docs.netlify.com/build/configure-builds/environment-variables/
- Render Docs. Deploy a Node Express App: https://render.com/docs/deploy-node-express-app
- Render Docs. Environment Variables and Secrets: https://render.com/docs/configure-environment-variables
- Neon Docs. Connect from any application: https://neon.com/docs/connect/connect-from-any-app
- Neon Docs. Query with Neon's SQL Editor: https://neon.com/docs/get-started/query-with-neon-sql-editor
