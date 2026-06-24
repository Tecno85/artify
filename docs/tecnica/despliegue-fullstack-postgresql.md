# Guía de Despliegue Full-Stack de Artify con PostgreSQL

> **Proyecto:** Artify SENA PostgreSQL  
> **Objetivo:** publicar una versión funcional de Artify con frontend estático, backend Node.js + Express y base de datos PostgreSQL.  
> **Enfoque:** despliegue de prueba para validación técnica y evidencia académica.

## 1. Propósito de la guía

Esta guía describe el proceso recomendado para desplegar Artify de forma funcional en la web. A diferencia del despliegue estático, esta opción permite probar registro, inicio de sesión, persistencia en base de datos, panel administrativo y registro de operaciones.

El proceso se divide en tres servicios:

| Componente | Plataforma sugerida | Función |
| --- | --- | --- |
| Frontend | Netlify | Publicar los archivos HTML, CSS y JavaScript. |
| Backend | Render | Ejecutar Node.js + Express. |
| Base de datos | Neon PostgreSQL | Alojar la base de datos PostgreSQL. |

## 2. Consideraciones antes de iniciar

Antes de grabar el video de evidencia, recomiendo realizar el proceso una vez como práctica. En esa primera ejecución se identifican pantallas, tiempos de espera, errores comunes y valores que no deben mostrarse en cámara.

Para la grabación final se deben evitar:

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

## 5. Crear la base de datos en Neon

1. Ingreso a Neon y creo un proyecto nuevo.
2. Selecciono PostgreSQL como motor de base de datos.
3. Creo o uso la base de datos principal del proyecto.
4. Copio la cadena de conexión desde la opción **Connect**.
5. Identifico la URL con formato similar a:

```env
postgresql://usuario:contrasena@host/dbname?sslmode=require
```

Neon entrega una cadena de conexión con usuario, contraseña, host y nombre de base de datos. Esta cadena se usará como `DATABASE_URL` en el backend.

## 6. Crear las tablas en PostgreSQL

Con la base creada, debo ejecutar los scripts del proyecto:

```bash
psql "DATABASE_URL_DE_NEON" -f database/postgresql/schema.sql
psql "DATABASE_URL_DE_NEON" -f database/postgresql/seed.sql
```

Después verifico que existan las tablas:

```bash
psql "DATABASE_URL_DE_NEON" -c "\\dt"
```

Resultado esperado:

- `USUARIO`
- `CONFIGURACION`
- `IMAGEN`
- `SESION_EDICION`
- `OPERACION`

## 7. Desplegar el backend en Render

En Render creo un nuevo servicio web conectado al repositorio de GitHub.

Configuración sugerida:

| Campo | Valor |
| --- | --- |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `pnpm install` |
| Start Command | `pnpm start` |
| Branch | `main` |

Variables de entorno del backend:

```env
DATABASE_URL=postgresql://usuario:contrasena@host/dbname?sslmode=require
DB_HOST=host
DB_PORT=5432
DB_USER=usuario
DB_PASSWORD=contrasena
DB_NAME=nombre_base_datos
ADMIN_USER=admin@artify.com
ADMIN_PASSWORD=contrasena_segura
TOKEN_SECRET=secreto_largo_y_seguro
PORT=3000
NODE_ENV=production
```

Notas:

- `DATABASE_URL` es la variable principal para conectar con Neon.
- `TOKEN_SECRET` debe ser largo y no debe compartirse.
- `ADMIN_PASSWORD` no debe coincidir con claves personales.
- Render asigna una URL pública al backend cuando el despliegue finaliza.

## 8. Verificar el backend publicado

Cuando Render termine el despliegue, abro la URL pública del backend. Luego pruebo una ruta pública:

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

## 9. Desplegar el frontend en Netlify

El proyecto ya incluye `netlify.toml` con esta configuración:

```toml
[build]
  command = "node scripts/write-frontend-config.js"
  publish = "frontend"
```

En Netlify debo conectar el repositorio y configurar la variable:

```env
ARTIFY_API_URL=https://url-del-backend.onrender.com
```

Esta variable permite que el frontend publicado consuma el backend externo. No se debe agregar `/api` al final porque el código ya construye las rutas completas.

## 10. Verificar el frontend publicado

Después del despliegue en Netlify, realizo estas pruebas:

| Prueba | Resultado esperado |
| --- | --- |
| Abrir página principal | La interfaz carga correctamente. |
| Abrir registro | El formulario se muestra sin errores. |
| Registrar usuario | Se crea el usuario en PostgreSQL. |
| Iniciar sesión | El sistema entrega token y abre el editor. |
| Abrir editor | Se puede cargar una imagen. |
| Registrar operación | El backend guarda la operación. |
| Entrar como administrador | El panel lista usuarios registrados. |

## 11. Guía para practicar antes del video

Primera práctica:

1. Crear base en Neon.
2. Ejecutar `schema.sql` y `seed.sql`.
3. Crear servicio backend en Render.
4. Configurar variables del backend.
5. Confirmar respuesta de la API.
6. Crear sitio frontend en Netlify.
7. Configurar `ARTIFY_API_URL`.
8. Confirmar registro, login y editor.
9. Anotar errores o tiempos de espera.
10. Repetir el proceso en una grabación limpia.

Durante la práctica puedo pausar, revisar logs y corregir variables. Durante el video conviene mostrar el proceso ya conocido y ocultar secretos.

## 12. Guion breve para el video

1. Presento el objetivo: publicar Artify con frontend, backend y PostgreSQL.
2. Muestro el repositorio y la estructura general.
3. Muestro la base en Neon sin exponer la contraseña.
4. Explico que cargué `schema.sql` y `seed.sql`.
5. Muestro Render con el backend desplegado.
6. Verifico una ruta pública de la API.
7. Muestro Netlify con `ARTIFY_API_URL` configurado.
8. Abro la URL pública del frontend.
9. Registro o inicio sesión con un usuario de prueba.
10. Abro el editor y realizo una prueba básica.
11. Concluyo explicando que la aplicación quedó funcional en la web.

## 13. Problemas comunes

| Problema | Causa probable | Solución |
| --- | --- | --- |
| Error de conexión a PostgreSQL | `DATABASE_URL` incorrecta o sin SSL. | Copiar nuevamente la cadena desde Neon. |
| El backend despliega pero la API falla | No se ejecutó `schema.sql`. | Crear tablas en la base remota. |
| Login no responde desde Netlify | `ARTIFY_API_URL` no apunta al backend correcto. | Revisar variable en Netlify y redeploy. |
| Error CORS | Backend no permite solicitudes del frontend. | Revisar configuración de `cors()` en Express. |
| Usuario duplicado en pruebas | Se repitió correo o cédula. | Usar datos nuevos de prueba. |
| Variables visibles en pantalla | Se abrió un panel con secretos. | Detener grabación y repetir ocultando valores. |

## 14. Referencias

- Netlify Docs. File-based configuration: https://docs.netlify.com/build/configure-builds/file-based-configuration/
- Netlify Docs. Environment variables: https://docs.netlify.com/build/environment-variables/overview/
- Render Docs. Deploy a Node Express App: https://render.com/docs/deploy-node-express-app
- Neon Docs. Connect from any application: https://neon.com/docs/connect/connect-from-any-app
