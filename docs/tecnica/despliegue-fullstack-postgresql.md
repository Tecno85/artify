# Guía de Despliegue Full-Stack de Artify con PostgreSQL

> **Proyecto:** Artify SENA PostgreSQL  
> **Objetivo:** publicar una versión funcional de Artify con frontend estático, backend Node.js + Express y base de datos PostgreSQL.  
> **Enfoque:** despliegue de prueba para validación técnica y evidencia académica.

## 1. Propósito de la guía

En esta guía describo el proceso que sigo para desplegar Artify de forma funcional en la web. A diferencia del despliegue estático, esta opción me permite probar registro, inicio de sesión, persistencia en base de datos, panel administrativo y registro de operaciones.

El resultado esperado es una aplicación distribuida en tres servicios:

- Netlify publica el frontend estático.
- Render ejecuta el backend Node.js + Express.
- Neon aloja PostgreSQL y conserva los datos.

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
| `ADMIN_USER` | Login del administrador de Artify. | `admin@artify.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador. | valor privado |
| `TOKEN_SECRET` | Firma de tokens JWT. | secreto largo y privado |
| `DATABASE_URL` | Conexión Render -> Neon. | se copia desde Neon |
| `ARTIFY_API_URL` | Conexión Netlify -> Render. | URL pública del backend |
| `CORS_ORIGIN` | Origen permitido en backend. | URL pública del frontend |

`TOKEN_SECRET`, `ADMIN_PASSWORD` y `DATABASE_URL` no deben quedar en capturas, commits, documentos públicos ni videos.

Para la grabación final evito:

- Mostrar contraseñas, tokens o cadenas completas de conexión.
- Abrir el archivo `.env` real si contiene secretos visibles.
- Mostrar credenciales administrativas reales.
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

Antes de configurar servicios externos, confirmo que el proyecto esté actualizado:

```bash
git status
git log --oneline -3
```

Si hay cambios pendientes, los reviso, los agrego y hago commit antes de desplegar:

```bash
git diff --stat
git add archivo-modificado
git commit -m "docs(despliegue): describir ajuste realizado"
git status
```

También confirmo que el backend pasa la validación:

```bash
cd backend
pnpm install
pnpm run check
pnpm test
```

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

1. Ingreso a Neon con mi cuenta.
2. Selecciono **New Project**.
3. Uso un nombre identificable, por ejemplo `artify-sena-postgresql`.
4. Selecciono PostgreSQL `16` como versión recomendada para esta entrega.
5. Selecciono una región cercana al backend que usaré en Render, para reducir latencia.
6. Confirmo la creación del proyecto.

PostgreSQL 16 es una versión estable y compatible con el esquema de Artify. El proyecto no usa funciones específicas que obliguen a una versión superior, por lo que PostgreSQL 16 ofrece una base prudente para documentación, pruebas y despliegue.

### 5.2 Definir la base de datos activa

Neon puede crear una base inicial por defecto. Para Artify debo trabajar con una base destinada al proyecto. Puedo usar la base que Neon crea inicialmente o crear una base llamada:

```text
artify_db
```

Lo importante es que el nombre de la base en la cadena `DATABASE_URL` coincida con la base donde cargaré `schema.sql` y `seed.sql`.

### 5.3 Obtener la cadena de conexión

En el panel del proyecto abro la opción **Connect** y copio una cadena de conexión PostgreSQL. El formato esperado es:

```env
postgresql://usuario:contrasena@host/dbname?sslmode=require
```

Para Render uso esta cadena como `DATABASE_URL`. Si Neon ofrece varias opciones, puedo usar la conexión directa o la conexión con pooler. Para este proyecto académico cualquiera de las dos funciona, pero mantengo una sola cadena consistente durante toda la configuración.

Antes de pegarla en Render verifico:

- Que incluya `sslmode=require`.
- Que el nombre final de la ruta sea la base correcta, por ejemplo `/artify_db`.
- Que no tenga espacios al inicio o al final.
- Que no se muestre completa en capturas, videos o documentos versionados.

### 5.4 Criterios de seguridad

- No guardo la cadena real de Neon en el repositorio.
- No la copio en `README.md`, documentos o evidencias visibles.
- No reutilizo la contraseña de Neon como contraseña administrativa de Artify.
- Si la cadena se expone durante una práctica o grabación, genero una nueva contraseña o una nueva cadena desde Neon antes del despliegue final.

## 6. Creo las Tablas en PostgreSQL

Con la base creada, debo ejecutar los scripts del proyecto desde la raíz del repositorio:

```bash
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -f database/postgresql/schema.sql
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -f database/postgresql/seed.sql
```

Este paso corresponde al aprovisionamiento inicial o a un reinicio controlado de la base. El archivo `schema.sql` elimina y vuelve a crear los objetos del proyecto; por eso no debo ejecutarlo sobre una base con información útil sin realizar primero una copia de seguridad.

Después verifico que existan las tablas y la vista:

```bash
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -c "\\dt"
psql "postgresql://usuario:contrasena@host/dbname?sslmode=require" -c "\\dv"
```

En la práctica reemplazo la cadena de ejemplo por la URL real entregada por Neon y evito mostrarla completa en capturas o videos.

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

Si no tengo `psql` disponible en mi equipo, uso el editor SQL de Neon:

1. Abro el proyecto en Neon.
2. Entro al editor SQL.
3. Ejecuto primero el contenido de `database/postgresql/schema.sql`.
4. Luego ejecuto el contenido de `database/postgresql/seed.sql`.
5. Verifico tablas y vista con consultas equivalentes:

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

## 7. Desplegar el backend en Render

En Render publico primero el backend porque Netlify necesita conocer la URL pública de la API.

### 7.1 Crear el servicio web

1. Ingreso a Render.
2. Selecciono **New**.
3. Selecciono **Web Service**.
4. Conecto mi cuenta de GitHub si todavía no está conectada.
5. Selecciono el repositorio `artify-sena-postgresql`.
6. Confirmo que Render usará la rama `main`.

### 7.2 Configurar build y arranque

Configuración sugerida:

| Campo | Valor |
| --- | --- |
| Name | `artify-sena-backend` |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `pnpm install --frozen-lockfile` |
| Start Command | `pnpm start` |
| Branch | `main` |
| Health Check Path | `/health` |

El valor crítico es `Root Directory = backend`. Si dejo la raíz del repositorio como directorio del servicio, Render intentará instalar dependencias desde el lugar equivocado y el backend no iniciará correctamente.

### 7.3 Configurar variables de entorno

En la sección **Environment** agrego las variables del backend. No uso `backend/.env` en Render; cada valor se declara en el panel.

Variables de entorno mínimas del backend en producción:

```env
DATABASE_URL=postgresql://usuario:contrasena@host/dbname?sslmode=require
ADMIN_USER=admin@artify.com
ADMIN_PASSWORD=contrasena_segura
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

Notas:

- `DATABASE_URL` es la variable principal para conectar con Neon.
- Las variables separadas `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` se reservan para configuración local o entornos donde no se use una cadena completa.
- Defino `TOKEN_SECRET` como un valor largo y no lo comparto.
- Uso una `ADMIN_PASSWORD` diferente a mis claves personales.
- Render asigna el puerto mediante `PORT`; no necesito declararlo manualmente en el panel.
- `NODE_VERSION` fija una versión compatible con `backend/package.json` y `backend/.node-version`.
- Si todavía no conozco la URL de Netlify, dejo `CORS_ORIGIN` pendiente y lo actualizo al finalizar el despliegue del frontend.
- Render asigna una URL pública al backend cuando el despliegue finaliza.

### 7.4 Ejecutar el despliegue

Después de guardar la configuración:

1. Selecciono **Create Web Service**.
2. Espero a que Render ejecute el build.
3. Reviso los logs del despliegue.
4. Confirmo que aparezca la instalación con `pnpm`.
5. Confirmo que el proceso ejecute `pnpm start`.
6. Copio la URL pública del servicio, con formato similar a:

```text
https://artify-sena-backend.onrender.com
```

No agrego `/api` a esta URL base. Las rutas se agregan desde el frontend y desde las pruebas manuales.

## 8. Verificar el backend publicado

Cuando Render termine el despliegue, abro la URL pública del backend y pruebo primero la ruta de salud:

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

Esta prueba confirma que Express inició correctamente. Después pruebo una ruta pública que sí consulta PostgreSQL:

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

### 8.1 Orden de diagnóstico

Si algo falla, reviso en este orden:

| Resultado | Interpretación | Acción |
| --- | --- | --- |
| `/health` no responde | El servicio no inició o Render falló en build/start. | Revisar logs, `Root Directory`, comandos y `NODE_VERSION`. |
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
2. Selecciono **Add new site**.
3. Selecciono **Import an existing project**.
4. Elijo GitHub como proveedor.
5. Selecciono el repositorio `artify-sena-postgresql`.
6. Mantengo la raíz del repositorio como base del proyecto.
7. No configuro `frontend` como base directory, porque `netlify.toml` ya indica que se publica la carpeta `frontend`.

Configuración esperada:

| Campo | Valor |
| --- | --- |
| Base directory | vacío o raíz del repositorio |
| Build command | `node scripts/write-frontend-config.js` |
| Publish directory | `frontend` |
| Branch | `main` |

### 9.2 Configurar la URL del backend

Antes de lanzar o repetir el despliegue del frontend, configuro esta variable en Netlify:

```env
ARTIFY_API_URL=https://url-del-backend.onrender.com
```

Esta variable permite que el frontend publicado consuma el backend externo. No agrego `/api` al final porque el código ya construye las rutas completas.

El script `scripts/write-frontend-config.js` lee `ARTIFY_API_URL` y genera `frontend/assets/js/config.js` durante el build. Por eso, si cambio esta variable en Netlify, debo ejecutar un nuevo deploy para que el frontend tome el nuevo backend.

### 9.3 Publicar y tomar la URL final

Después de guardar la variable:

1. Ejecuto el deploy en Netlify.
2. Espero a que el build termine correctamente.
3. Abro la URL pública que entrega Netlify.
4. Copio la URL final, por ejemplo:

```text
https://artify-sena.netlify.app
```

### 9.4 Actualizar CORS en Render

Cuando Netlify entregue la URL pública del frontend, regreso a Render y actualizo:

```env
CORS_ORIGIN=https://url-del-frontend.netlify.app
```

Después reinicio o redespliego el backend para que tome el origen definitivo. Este paso es obligatorio porque el backend solo permite peticiones desde los orígenes definidos en `CORS_ORIGIN`.

Si durante la práctica uso más de un origen, puedo separarlos por coma:

```env
CORS_ORIGIN=https://url-del-frontend.netlify.app,http://localhost:8080
```

Para la entrega pública dejo principalmente la URL real de Netlify.

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

En el navegador abro las herramientas de desarrollo y reviso la pestaña **Network**:

- Las peticiones deben apuntar a `https://url-del-backend.onrender.com`.
- No deben aparecer errores CORS.
- Las respuestas de login y registro deben ser `200`, `201`, `400` o `401` según el caso probado, no errores de red.
- Si aparece `Failed to fetch`, reviso `ARTIFY_API_URL` en Netlify y `CORS_ORIGIN` en Render.

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

## 11. Guía para practicar antes del video

La primera práctica sirve para confirmar que el procedimiento es repetible y para identificar en qué pantallas aparecen secretos. No uso esta práctica como evidencia final si durante el proceso se muestran contraseñas, tokens o cadenas completas.

### 11.1 Ensayo técnico

1. Confirmo que `main` está actualizado en GitHub.
2. Creo el proyecto en Neon.
3. Selecciono PostgreSQL `16`.
4. Confirmo o creo la base `artify_db`.
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
20. Pruebo registro, login, editor y panel admin.

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
4. Que tengo a mano `ADMIN_USER`, `ADMIN_PASSWORD` y `TOKEN_SECRET`.
5. Que no reutilizo una cadena `DATABASE_URL` de una base eliminada.

### 12.3 Repetición controlada sin eliminar servicios

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

## 14. Problemas comunes

| Problema | Causa probable | Solución |
| --- | --- | --- |
| Error de conexión a PostgreSQL | `DATABASE_URL` incorrecta o sin SSL. | Copio nuevamente la cadena desde Neon. |
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
- Netlify Docs. Environment variables: https://docs.netlify.com/build/environment-variables/overview/
- Render Docs. Deploy a Node Express App: https://render.com/docs/deploy-node-express-app
- Neon Docs. Connect from any application: https://neon.com/docs/connect/connect-from-any-app
