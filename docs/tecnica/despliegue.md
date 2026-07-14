# Despliegue de Artify

> **Estado:** procedimiento oficial vigente
> **Frontend:** GitHub Pages
> **Backend:** Render
> **Base de datos:** Neon PostgreSQL
> **Última validación:** 13 de julio de 2026

En esta guía documento cómo aprovisiono por primera vez y cómo vuelvo a desplegar la versión pública de Artify. La instalación en un equipo personal se explica por separado en [`plan-instalacion-artify.md`](./plan-instalacion-artify.md).

## 1. Arquitectura desplegada

Distribuyo los componentes de Artify en tres servicios:

```mermaid
flowchart LR
    A["GitHub: rama main"] --> B["GitHub Actions"]
    B --> C["GitHub Pages: frontend"]
    C -->|"ARTIFY_API_URL"| D["Render: API Node.js"]
    D -->|"DATABASE_URL"| E["Neon: PostgreSQL"]
```

| Componente | Servicio | URL o recurso |
| --- | --- | --- |
| Frontend | GitHub Pages | `https://tecno85.github.io/artify/` |
| Backend | Render | `https://artify-sena-postgresql.onrender.com` |
| Base de datos | Neon PostgreSQL | Cadena privada `DATABASE_URL` |
| Código fuente | GitHub | `https://github.com/Tecno85/artify` |

GitHub Pages publica solamente archivos estáticos. El backend Express y PostgreSQL permanecen fuera de Pages y se consumen mediante HTTPS.

GitHub Pages no permite definir encabezados HTTP personalizados desde el repositorio. Las cabeceras de seguridad de la API continúan configuradas en Express; cualquier política adicional para el frontend debe implementarse en el HTML cuando sea compatible o requeriría otro proveedor o CDN.

La API oculta `X-Powered-By`, limita los cuerpos a 64 KB y marca las respuestas bajo `/api` con `Cache-Control: no-store`. Artify envía al backend datos de usuario, preferencias y metadatos; el archivo de imagen permanece en el navegador, por lo que este límite no afecta la carga normal del editor.

## 2. Elegir el procedimiento

Uso el procedimiento que corresponda:

| Situación | Secciones |
| --- | --- |
| Es la primera publicación de Artify | 3, 4, 5 y 6 |
| Neon, Render y Pages ya existen y solo publicaré cambios | 7 |
| Quiero comprobar la versión pública | 8 |

Antes de cualquier despliegue verifico la sintaxis:

**Ubicación inicial:** raíz `artify/`.

```bash
cd backend
pnpm run check
```

### Advertencia sobre las pruebas

`pnpm test` no es una comprobación de solo lectura. La suite crea, actualiza y elimina usuarios, sesiones, imágenes, configuraciones y operaciones temporales.

> **Nunca ejecuto `pnpm test` con `DATABASE_URL` apuntando a Neon o a una base de producción.** Solo la ejecuto contra una base PostgreSQL exclusiva cuyo nombre termine en `_test`. Las pruebas frontend se ejecutan aparte con `pnpm run test:frontend` y no usan la base de datos.

## 3. Aprovisionamiento inicial de Neon

Esta sección se realiza una sola vez, cuando todavía no existe la base PostgreSQL pública.

### 3.1 Crear el proyecto

1. Inicio sesión en Neon.
2. Creo un proyecto PostgreSQL para Artify.
3. Selecciono una región cercana a los usuarios o al servicio de Render.
4. Abro el panel de conexión y copio la cadena PostgreSQL.
5. Confirmo que la cadena use SSL, normalmente mediante `sslmode=require`.

La cadena tiene una estructura similar a:

```text
postgresql://usuario:contrasena@host/base?sslmode=require
```

La guardo temporalmente como `DATABASE_URL` en mi terminal y después en Render. No la escribo en archivos versionados, capturas ni documentación.

**Windows - PowerShell:**

```powershell
$env:DATABASE_URL = "PEGAR_AQUI_LA_URL_PRIVADA_DE_NEON"
```

**macOS o Linux - Terminal:**

```bash
export DATABASE_URL='PEGAR_AQUI_LA_URL_PRIVADA_DE_NEON'
```

### 3.2 Cargar el esquema

**Ubicación inicial:** raíz `artify/`.

> **Advertencia destructiva:** `database/postgresql/schema.sql` contiene instrucciones `DROP`. Solo lo ejecuto sobre una base nueva o durante un reinicio controlado. Si la base ya contiene información útil, primero genero y verifico un respaldo.

**Windows - PowerShell:**

```powershell
psql "$env:DATABASE_URL" -f database/postgresql/schema.sql
psql "$env:DATABASE_URL" -f database/postgresql/seed.sql
psql "$env:DATABASE_URL" -c "\dt"
psql "$env:DATABASE_URL" -c "\dv"
```

**macOS o Linux - Terminal:**

```bash
psql "$DATABASE_URL" -f database/postgresql/schema.sql
psql "$DATABASE_URL" -f database/postgresql/seed.sql
psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "\dv"
```

Debo encontrar cinco tablas y la vista `v_usuarios_activos`. `seed.sql` agrega únicamente un registro de referencia y no crea credenciales válidas para iniciar sesión.

Cuando termino, retiro la variable de la terminal si el equipo es compartido:

**Windows - PowerShell:**

```powershell
Remove-Item Env:DATABASE_URL
```

**macOS o Linux - Terminal:**

```bash
unset DATABASE_URL
```

## 4. Aprovisionamiento inicial de Render

Esta sección se realiza una sola vez, cuando todavía no existe el servicio backend.

### 4.1 Crear el servicio web

1. Inicio sesión en Render y selecciono **New > Web Service**.
2. Conecto mi cuenta de GitHub.
3. Selecciono el repositorio `Tecno85/artify`.
4. Configuro la rama `main`.
5. Defino la carpeta raíz como `backend`.
6. Selecciono el entorno de ejecución Node.
7. Uso estos comandos:

| Campo de Render | Valor |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `pnpm install --frozen-lockfile` |
| Start Command | `pnpm start` |
| Health Check Path | `/health` |
| Auto-Deploy | Activado para la rama `main` |

`backend/package.json` fija pnpm `11.1.1`, requiere Node.js `22.13.0` o superior y contiene el comando de inicio.

### 4.2 Configurar las variables

Primero genero un secreto aleatorio de 64 caracteres desde una terminal con Node.js instalado:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copio el resultado completo y lo uso como `TOKEN_SECRET`; no copio literalmente el texto de ejemplo del bloque siguiente.

En **Environment** configuro como mínimo:

```env
DATABASE_URL=postgresql://usuario:contrasena@host/base?sslmode=require
TOKEN_SECRET=PEGA_AQUI_LOS_64_CARACTERES_GENERADOS
NODE_VERSION=22.13.0
NODE_ENV=production
CORS_ORIGIN=https://tecno85.github.io
```

Reglas importantes:

- `DATABASE_URL` y `TOKEN_SECRET` nunca se guardan en Git.
- `TOKEN_SECRET` debe tener al menos 32 caracteres y no puede conservar un valor de ejemplo; el backend detiene el arranque si la configuración es insegura.
- `CORS_ORIGIN` contiene el origen de Pages, sin `/artify/` y sin barra final.
- El backend permite por CORS los métodos `GET`, `POST`, `PUT`, `DELETE` y `OPTIONS`, y las cabeceras `Content-Type` y `Authorization`; el navegador puede reutilizar el preflight durante 10 minutos.
- Render asigna `PORT`; normalmente no lo configuro manualmente.
- Si necesito varios orígenes autorizados, los separo con comas.

Ejemplo que también permite las pruebas manuales desde el frontend local:

```env
CORS_ORIGIN=https://tecno85.github.io,http://localhost:8080,http://127.0.0.1:8080
```

Guardo las variables y ejecuto el primer despliegue. En los registros debo encontrar el inicio de Express y la conexión correcta con PostgreSQL.

### 4.3 Comprobar Render

Reemplazo el dominio del ejemplo si Render asignó otro:

```text
https://artify-sena-postgresql.onrender.com/health
https://artify-sena-postgresql.onrender.com/ready
```

`/health` confirma que Express está activo. `/ready` confirma además que el backend puede consultar Neon. No continúo con Pages mientras `/ready` responda que la base no está disponible.

## 5. Aprovisionamiento inicial de GitHub Pages

### 5.1 Configurar la URL del backend

El frontend necesita conocer la URL pública de Render. En GitHub abro:

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
→ New repository variable
```

Creo esta variable:

| Campo | Valor |
| --- | --- |
| Name | `ARTIFY_API_URL` |
| Value | `https://artify-sena-postgresql.onrender.com` |

La URL del backend es pública y puede almacenarse como variable del repositorio. No agrego `/api` ni una barra al final.

### 5.2 Activar GitHub Pages

1. Abro **Settings > Pages**.
2. En **Build and deployment**, selecciono **Source: GitHub Actions**.
3. Confirmo que exista `.github/workflows/deploy-pages.yml`.
4. Abro **Actions > Desplegar frontend en GitHub Pages**.
5. Ejecuto **Run workflow** o realizo un `push` a `main`.

El workflow:

1. Descarga el repositorio.
2. Configura Node.js `22.13.0`.
3. Verifica que `ARTIFY_API_URL` exista.
4. Ejecuta `node scripts/write-frontend-config.js`.
5. Publica exclusivamente la carpeta `frontend/`.
6. Despliega el artefacto en GitHub Pages.

El archivo generado debe contener:

```javascript
window.ARTIFY_API_URL = "https://artify-sena-postgresql.onrender.com";
```

Puedo comprobarlo en:

```text
https://tecno85.github.io/artify/assets/js/config.js
```

No muevo `frontend/index.html` a la raíz. El workflow convierte `frontend/` en la raíz del sitio publicado.

## 6. Primera publicación completa

Después de aprovisionar Neon, Render y Pages, publico el estado confirmado del repositorio:

```bash
git status
git add archivo-modificado
git commit -m "tipo(scope): descripción"
git push origin main
```

El `push` produce dos acciones independientes:

- Render vuelve a desplegar el backend si detecta cambios en la rama configurada.
- GitHub Actions publica el frontend en Pages.

Superviso ambos procesos y después completo la verificación de la sección 8.

## 7. Redespliegue de una instalación existente

No vuelvo a crear Neon, Render ni Pages para publicar cambios normales.

### 7.1 Solo cambió el frontend

1. Confirmo que `ARTIFY_API_URL` siga definida en GitHub.
2. Subo el cambio a `main`.
3. Reviso **Actions > Desplegar frontend en GitHub Pages**.
4. Recargo el sitio cuando el workflow finalice.

### 7.2 Cambió el backend

1. Ejecuto `pnpm run check` localmente.
2. Ejecuto `pnpm test` únicamente contra una base local o exclusiva de pruebas.
3. Subo el cambio a `main`.
4. Reviso los registros del despliegue automático en Render.
5. Compruebo `/health` y `/ready`.

### 7.3 Cambió la base de datos

No ejecuto automáticamente `schema.sql` sobre Neon porque elimina y reconstruye los objetos.

1. Reviso el SQL exacto del cambio.
2. Creo y verifico un respaldo de Neon.
3. Preparo una migración incremental que conserve los datos.
4. Pruebo la migración en otra base PostgreSQL.
5. Solo después la ejecuto en producción.

`schema.sql` completo se reserva para aprovisionamiento inicial o reinicios controlados con autorización.

### 7.4 Cambió la URL de algún servicio

- Si cambia Render, actualizo `ARTIFY_API_URL` en GitHub y vuelvo a ejecutar el workflow de Pages.
- Si cambia Pages o su dominio, actualizo `CORS_ORIGIN` en Render y reinicio o redespliego el backend.
- Si cambia Neon, actualizo `DATABASE_URL` en Render y compruebo `/ready`.

## 8. Verificación posterior

### 8.1 Servicios

| Verificación | Resultado esperado |
| --- | --- |
| `https://tecno85.github.io/artify/` | Página principal con HTTP `200` |
| `/artify/assets/js/config.js` | URL de Render en `ARTIFY_API_URL` |
| `https://artify-sena-postgresql.onrender.com/health` | JSON con `ok: true` |
| `https://artify-sena-postgresql.onrender.com/ready` | JSON con `ok: true` y PostgreSQL disponible |

### 8.2 Flujo funcional

1. Abro la página de inicio y verifico los recursos visuales.
2. Registro un usuario.
3. Inicio sesión.
4. Cargo una imagen en el editor.
5. Aplico filtros, recorte y conversión.
6. Descargo la imagen.
7. Cierro sesión.
8. Valido el panel con un usuario administrador.

En las herramientas del navegador, las solicitudes deben apuntar a Render y no deben mostrar errores CORS ni `Failed to fetch`.

## 9. Rutas bajo `/artify/`

El sitio es un proyecto de GitHub Pages y utiliza el prefijo:

```text
/artify/
```

Mantengo relativas las rutas de HTML, CSS, JavaScript e imágenes. Evito rutas como:

```text
/pages/login.html
/assets/css/index.css
```

Estas rutas buscarían recursos en la raíz de `tecno85.github.io`. Las formas correctas dependen de la ubicación del archivo, por ejemplo:

```text
./pages/login.html
../assets/css/login.css
```

## 10. Problemas comunes

| Problema | Causa probable | Solución |
| --- | --- | --- |
| Pages muestra 404 | Se publicó la raíz del repositorio | Confirmar **Source: GitHub Actions** y `path: frontend` |
| Workflow falla al validar URL | Falta `ARTIFY_API_URL` | Crear la variable del repositorio |
| Frontend intenta usar el puerto `3000` | `config.js` se generó vacío | Corregir la variable y volver a ejecutar el workflow |
| Registro o login muestra `Failed to fetch` | URL incorrecta o CORS | Revisar `ARTIFY_API_URL` y `CORS_ORIGIN` |
| Error CORS | Render no permite GitHub Pages | Usar `CORS_ORIGIN=https://tecno85.github.io` y redesplegar |
| Backend tarda en responder | Servicio gratuito suspendido por inactividad | Esperar el arranque y reintentar |
| `/health` funciona pero `/ready` falla | Neon o `DATABASE_URL` no están disponibles | Revisar Neon, la variable y los registros de Render |
| El build de Render no encuentra el proyecto | Carpeta raíz incorrecta | Configurar **Root Directory: `backend`** |
| Render no encuentra pnpm | Versión de Node o gestor no preparados | Confirmar `NODE_VERSION=22.13.0` y `packageManager` en `backend/package.json` |
| CSS, JavaScript o imágenes devuelven 404 | Ruta absoluta incompatible | Usar rutas relativas al documento |

## 11. Estado validado

El 13 de julio de 2026 comprobé:

- Workflow de Pages finalizado con `success`.
- Frontend público con HTTP `200`.
- Login publicado con HTTP `200`.
- `config.js` apuntando al backend de Render.
- Respuesta CORS de Render para `https://tecno85.github.io`.
- Repositorio local y remoto sincronizados después del despliegue.

## 12. Evidencia académica sin exponer secretos

Para presentar la evidencia del despliegue, muestro:

1. Repositorio y workflow sin abrir secretos.
2. Ejecución verde en GitHub Actions.
3. URL pública de GitHub Pages.
4. `config.js` con la URL pública de Render.
5. `/health` y `/ready`.
6. Registro, login, editor y panel administrativo.
7. Tablas de Neon sin mostrar la cadena `DATABASE_URL`.

No muestro contraseñas, tokens de acceso, `TOKEN_SECRET` ni credenciales PostgreSQL.

## 13. Referencias oficiales

- GitHub Docs. GitHub Pages: https://docs.github.com/pages
- GitHub Docs. Custom workflows for GitHub Pages: https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Render Docs. Web services: https://render.com/docs/web-services
- Neon Docs. Conectar con PostgreSQL: https://neon.com/docs/connect/connect-from-any-app
- PostgreSQL. Herramienta `psql`: https://www.postgresql.org/docs/current/app-psql.html
