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

1. Ingreso a Neon y creo un proyecto nuevo.
2. Selecciono PostgreSQL como motor de base de datos.
3. Creo o uso la base de datos principal del proyecto.
4. Copio la cadena de conexión desde la opción **Connect**.
5. Identifico la URL con formato similar a:

```env
postgresql://usuario:contrasena@host/dbname?sslmode=require
```

Neon entrega una cadena de conexión con usuario, contraseña, host y nombre de base de datos. Uso esta cadena como `DATABASE_URL` en el backend.

## 6. Creo las Tablas en PostgreSQL

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
- Defino `TOKEN_SECRET` como un valor largo y no lo comparto.
- Uso una `ADMIN_PASSWORD` diferente a mis claves personales.
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

Esta variable permite que el frontend publicado consuma el backend externo. No agrego `/api` al final porque el código ya construye las rutas completas.

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
5. Confirmo la respuesta de la API.
6. Creo el sitio frontend en Netlify.
7. Configuro `ARTIFY_API_URL`.
8. Confirmo registro, login y editor.
9. Anoto errores o tiempos de espera.
10. Repito el proceso en una grabación limpia.

Durante la práctica puedo pausar, revisar logs y corregir variables. Durante el video muestro el proceso ya conocido y oculto secretos.

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
| Error de conexión a PostgreSQL | `DATABASE_URL` incorrecta o sin SSL. | Copio nuevamente la cadena desde Neon. |
| El backend despliega pero la API falla | No ejecuté `schema.sql`. | Creo las tablas en la base remota. |
| Login no responde desde Netlify | `ARTIFY_API_URL` no apunta al backend correcto. | Reviso la variable en Netlify y ejecuto un nuevo despliegue. |
| Error CORS | El backend no permite solicitudes del frontend. | Reviso la configuración de `cors()` en Express. |
| Usuario duplicado en pruebas | Repetí correo o cédula. | Uso datos nuevos de prueba. |
| Variables visibles en pantalla | Abrí un panel con secretos. | Detengo la grabación y repito ocultando valores. |

## 14. Referencias

- Netlify Docs. File-based configuration: https://docs.netlify.com/build/configure-builds/file-based-configuration/
- Netlify Docs. Environment variables: https://docs.netlify.com/build/environment-variables/overview/
- Render Docs. Deploy a Node Express App: https://render.com/docs/deploy-node-express-app
- Neon Docs. Connect from any application: https://neon.com/docs/connect/connect-from-any-app
