# Guía de Despliegue Full-Stack de Artify con PostgreSQL

> **Proyecto:** Artify SENA PostgreSQL  
> **Objetivo:** publicar una versión funcional de Artify con frontend estático, backend Node.js + Express y base de datos PostgreSQL.  
> **Enfoque:** despliegue de prueba para validación técnica y evidencia académica.

## 1. Propósito de la guía

En esta guía describo el proceso que sigo para desplegar Artify de forma funcional en la web. A diferencia del despliegue estático, esta opción me permite probar registro, inicio de sesión, persistencia en base de datos, panel administrativo y registro de operaciones.

Para organizar el despliegue, separo el proceso en tres servicios:

| Componente | Plataforma sugerida | Función |
| --- | --- | --- |
| Frontend | Netlify | Publicar los archivos HTML, CSS y JavaScript. |
| Backend | Render | Ejecuto Node.js + Express. |
| Base de datos | Neon PostgreSQL | Alojar la base de datos PostgreSQL. |

## 2. Consideraciones antes de iniciar

Antes de grabar el video de evidencia, realizo el proceso una vez como práctica. En esa primera ejecución identifico pantallas, tiempos de espera, errores comunes y valores que no debo mostrar en cámara.

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

## 4. Preparar el repositorio

Antes de configurar servicios externos, confirmo que el proyecto esté actualizado:

```bash
git status
git log --oneline -3
```

También confirmo que el backend pasa la validación:

```bash
cd backend
pnpm install
pnpm run check
pnpm test
```

Si las pruebas dependen de una base local, debo tener PostgreSQL activo y el archivo `.env` configurado.

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

En Render creo un nuevo servicio web conectado al repositorio de GitHub.

Configuración sugerida:

| Campo | Valor |
| --- | --- |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `pnpm install --frozen-lockfile` |
| Start Command | `pnpm start` |
| Branch | `main` |
| Health Check Path | `/health` |

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

Notas:

- `DATABASE_URL` es la variable principal para conectar con Neon.
- Las variables separadas `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` se reservan para configuración local o entornos donde no se use una cadena completa.
- Defino `TOKEN_SECRET` como un valor largo y no lo comparto.
- Uso una `ADMIN_PASSWORD` diferente a mis claves personales.
- Render asigna el puerto mediante `PORT`; no necesito declararlo manualmente en el panel.
- `NODE_VERSION` fija una versión compatible con `backend/package.json` y `backend/.node-version`.
- Si todavía no conozco la URL de Netlify, dejo `CORS_ORIGIN` pendiente y lo actualizo al finalizar el despliegue del frontend.
- Render asigna una URL pública al backend cuando el despliegue finaliza.

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

Después pruebo una ruta pública que sí consulta PostgreSQL:

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

Si la API no responde, reviso:

- Logs del servicio en Render.
- Variables de entorno.
- Cadena `DATABASE_URL`.
- Ejecución previa de `schema.sql`.
- Permisos o disponibilidad de la base en Neon.
- Health check `/health` para diferenciar error del proceso Express frente a error de base de datos.

## 9. Desplegar el frontend en Netlify

El proyecto ya incluye `netlify.toml` en la raíz del repositorio con esta configuración:

```toml
[build]
  command = "node scripts/write-frontend-config.js"
  publish = "frontend"
```

En Netlify conecto el repositorio desde la raíz, sin definir `frontend` como base directory, y configuro la variable:

```env
ARTIFY_API_URL=https://url-del-backend.onrender.com
```

Esta variable permite que el frontend publicado consuma el backend externo. No agrego `/api` al final porque el código ya construye las rutas completas.

Cuando Netlify entregue la URL pública del frontend, regreso a Render y actualizo:

```env
CORS_ORIGIN=https://url-del-frontend.netlify.app
```

Después redepliego o reinicio el backend para que tome el origen definitivo.

## 10. Verificar el frontend publicado

Después del despliegue en Netlify, realizo estas pruebas:

| Prueba | Resultado esperado |
| --- | --- |
| Abrir página principal | Confirmo que la interfaz carga correctamente. |
| Abrir registro | Confirmo que el formulario se muestra sin errores. |
| Registrar usuario | Confirmo que el usuario queda creado en PostgreSQL. |
| Iniciar sesión | Confirmo que el sistema entrega token y abre el editor. |
| Abrir editor | Confirmo que puedo cargar una imagen. |
| Registrar operación | Confirmo que el backend guarda la operación. |
| Entrar como administrador | Confirmo que el panel lista usuarios registrados. |

## 11. Guía para practicar antes del video

Primera práctica:

1. Creo la base en Neon.
2. Ejecuto `schema.sql` y `seed.sql`.
3. Creo el servicio backend en Render.
4. Configuro las variables del backend.
5. Confirmo `/health` y luego una ruta de analytics.
6. Creo el sitio frontend en Netlify.
7. Configuro `ARTIFY_API_URL`.
8. Copio la URL pública de Netlify en `CORS_ORIGIN` dentro de Render.
9. Confirmo registro, login y editor.
10. Anoto errores o tiempos de espera.
11. Repito el proceso en una grabación limpia.

Durante la práctica puedo pausar, revisar logs y corregir variables. Durante el video muestro el proceso ya conocido y oculto secretos.

## 12. Guion breve para el video

1. Presento el objetivo: publicar Artify con frontend, backend y PostgreSQL.
2. Muestro el repositorio y la estructura general.
3. Muestro la base en Neon sin exponer la contraseña.
4. Explico que cargué `schema.sql` y `seed.sql`.
5. Muestro Render con el backend desplegado.
6. Verifico `/health` y una ruta pública de la API.
7. Muestro Netlify con `ARTIFY_API_URL` configurado.
8. Muestro que `CORS_ORIGIN` quedó actualizado con la URL del frontend.
9. Abro la URL pública del frontend.
10. Registro o inicio sesión con un usuario de prueba.
11. Abro el editor y realizo una prueba básica.
12. Concluyo explicando que la aplicación quedó funcional en la web.

## 13. Problemas comunes

| Problema | Causa probable | Solución |
| --- | --- | --- |
| Error de conexión a PostgreSQL | `DATABASE_URL` incorrecta o sin SSL. | Copio nuevamente la cadena desde Neon. |
| `/health` responde pero analytics falla | No ejecuté `schema.sql` o la base no está disponible. | Verifico Neon, cargo el esquema inicial y reviso `DATABASE_URL`. |
| `/health` no responde | El servicio Express no inició o Render falló en build/start. | Revisar logs, `Root Directory`, `Build Command`, `Start Command` y versión de Node. |
| Login no responde desde Netlify | `ARTIFY_API_URL` no apunta al backend correcto. | Reviso la variable en Netlify y ejecuto un nuevo despliegue. |
| Error CORS | `CORS_ORIGIN` no incluye la URL pública del frontend. | Agrego la URL de Netlify en `CORS_ORIGIN` y redespliego el backend. |
| Usuario duplicado en pruebas | Repetí correo o cédula. | Uso datos nuevos de prueba. |
| Variables visibles en pantalla | Abrí un panel con secretos. | Detengo la grabación y repito ocultando valores. |

## 14. Referencias

- Netlify Docs. File-based configuration: https://docs.netlify.com/build/configure-builds/file-based-configuration/
- Netlify Docs. Environment variables: https://docs.netlify.com/build/environment-variables/overview/
- Render Docs. Deploy a Node Express App: https://render.com/docs/deploy-node-express-app
- Neon Docs. Connect from any application: https://neon.com/docs/connect/connect-from-any-app
