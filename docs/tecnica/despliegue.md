# Guía de Despliegue y Ejecución Local

> **Proyecto:** Artify SENA PostgreSQL
> **Entorno principal:** Local / desarrollo
> **Backend:** Node.js + Express
> **Frontend:** HTML, CSS y JavaScript Vanilla
> **Base de datos:** PostgreSQL
> **Fecha:** Junio 2026

---

## 1. Objetivo del Documento

En este documento explico los pasos técnicos necesarios para preparar, ejecutar y verificar Artify SENA PostgreSQL en un entorno local. Esta guía complementa el `README.md` y se enfoca en la ejecución del backend, el frontend y la base de datos PostgreSQL.

---

## 2. Requisitos Previos

Antes de ejecutar el proyecto confirmo que estén disponibles estas herramientas:

| Herramienta | Versión recomendada | Uso |
| --- | --- | --- |
| Node.js | 22.13 o superior | Ejecutar el backend. |
| pnpm | 11.1.1 | Instalar dependencias y ejecutar scripts del backend. |
| PostgreSQL | 15 o superior | Base de datos relacional. |
| Git | Versión estable | Clonar y versionar el proyecto. |
| Navegador moderno | Chrome, Edge, Firefox, Safari u Opera | Usar el frontend. |

---

## 3. Clonar el Proyecto

```bash
git clone https://github.com/Tecno85/artify-sena-postgresql.git
cd artify-sena-postgresql
```

---

## 4. Instalar Dependencias del Backend

Las dependencias se instalan dentro de la carpeta `backend/`.

```bash
cd backend
pnpm install
```

El proyecto usa `pnpm` como gestor oficial. No se debe mezclar con `npm install` ni generar `package-lock.json`.

---

## 5. Configurar Variables de Entorno

El backend necesita variables de entorno para conectarse a PostgreSQL, configurar el usuario administrador y firmar tokens.

Puedo crear `backend/.env` a partir de `.env.example`:

```bash
cp ../.env.example .env
```

Variables principales:

```env
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/artify_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contrasena_postgresql
DB_NAME=artify_db
ADMIN_USER=admin@artify.com
ADMIN_PASSWORD=tu_contrasena_admin
TOKEN_SECRET=un_secreto_largo_y_aleatorio
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080,http://127.0.0.1:8080
```

### Consideraciones

- `backend/.env` no debe subirse al repositorio.
- `TOKEN_SECRET` debe ser largo y difícil de adivinar.
- `ADMIN_PASSWORD` debe cambiarse por una contraseña segura en cada entorno.
- `CORS_ORIGIN` debe incluir el origen desde el que se sirve el frontend.

---

## 6. Crear la Base de Datos

Primero creo la base de datos:

```bash
createdb artify_db
```

Si `createdb` no está disponible, puedo crearla desde `psql` usando la base administrativa local:

```bash
psql -d postgres -c 'CREATE DATABASE artify_db;'
```

Luego cargo el esquema y los datos mínimos de referencia:

```bash
psql -d artify_db -f database/postgresql/schema.sql
psql -d artify_db -f database/postgresql/seed.sql
```

Al finalizar, verifico la base, las tablas y la vista:

```sql
\l
\c artify_db
\dt
\dv
```

Si prefiero validar en un solo comando desde la terminal, puedo usar `psql -d artify_db -c "\\dt"` para tablas y `psql -d artify_db -c "\\dv"` para vistas.

### Preparación para pruebas automatizadas

Antes de ejecutar `pnpm test`, confirmo dos condiciones:

1. Existe `backend/.env` con `DATABASE_URL` o las variables `DB_*`, además de `TOKEN_SECRET`, `ADMIN_USER` y `ADMIN_PASSWORD`.
2. La base `artify_db` existe y ya recibió `schema.sql` y `seed.sql`.

Si falta `backend/.env`, la suite puede fallar con secretos indefinidos, por ejemplo `TOKEN_SECRET`, `ADMIN_USER` o `ADMIN_PASSWORD`. Si falta la base o el esquema, `/health` puede responder, pero los endpoints que consultan PostgreSQL devuelven errores porque no encuentran la conexión, las tablas o la vista esperada.

---

## 7. Ejecutar el Backend

Desde la carpeta `backend/`:

```bash
pnpm start
```

Salida esperada:

```text
Conectado a PostgreSQL correctamente
Servidor corriendo en http://localhost:3000
```

Para desarrollo con recarga automática:

```bash
pnpm run dev
```

---

## 8. Ejecutar el Frontend

El frontend es estático. Para probar rutas y navegación de forma estable, sirvo la carpeta `frontend/` por HTTP.

Desde la raíz del proyecto:

```bash
npx http-server frontend -p 8080
```

Luego abro:

```text
http://127.0.0.1:8080
```

---

## 9. Verificar el Funcionamiento

### Verificación del backend

```bash
curl http://127.0.0.1:3000/health
```

Resultado esperado:

```json
{
  "ok": true,
  "servicio": "artify-api"
}
```

```bash
cd backend
pnpm run check
```

### Pruebas automatizadas

```bash
cd backend
pnpm test
```

La suite actual valida autenticación, rutas protegidas, tokens, configuración básica, conexión con PostgreSQL y limpieza de usuarios temporales.

Si `pnpm` informa que requiere Node.js `22.13` o superior, reviso primero qué binario está tomando la terminal:

```bash
node -v
which node
```

En macOS con Homebrew puedo priorizar Node 22 para la sesión actual:

```bash
PATH=/opt/homebrew/opt/node@22/bin:$PATH pnpm test
```

En entornos restringidos, como validaciones ejecutadas desde herramientas con sandbox, Node puede no tener permiso para abrir sockets locales hacia PostgreSQL aunque `psql` sí funcione. En ese caso, la verificación válida es ejecutar la suite en una terminal normal del sistema con PostgreSQL activo y las variables de `backend/.env` configuradas.

### Verificación manual básica

1. Abro `http://127.0.0.1:8080`.
2. Registro un usuario de prueba.
3. Inicio sesión.
4. Confirmo redirección al editor.
5. Cargo una imagen.
6. Pruebo una operación de edición.
7. Descargo la imagen resultante.

---

## 10. Puertos Utilizados

| Servicio | Puerto | Descripción |
| --- | --- | --- |
| Backend Express | `3000` | API principal del sistema. |
| Frontend local | `8080` | Servidor estático recomendado para pruebas. |
| PostgreSQL | `5432` | Puerto habitual de PostgreSQL. |
| Backend de pruebas | `3100` | Puerto usado por la suite automatizada cuando aplica. |

---

## 11. Script de Configuración Frontend

El proyecto incluye el script:

```text
scripts/write-frontend-config.js
```

Este script genera `frontend/assets/js/config.js` durante el despliegue en Netlify usando la variable `ARTIFY_API_URL`.

Para ejecución local, `config.js` puede permanecer vacío para que el frontend use `http://localhost:3000` como backend por defecto.

---

## 12. Problemas Comunes

| Problema | Posible causa | Solución |
| --- | --- | --- |
| `Error al conectar a PostgreSQL` | Variables incorrectas o servicio detenido. | Revisar `backend/.env` e iniciar PostgreSQL. |
| `database "artify_db" does not exist` | La base local no fue creada. | Ejecutar `createdb artify_db` o `psql -d postgres -c 'CREATE DATABASE artify_db;'`. |
| `TOKEN_SECRET`, `ADMIN_USER` o `ADMIN_PASSWORD` indefinidos en pruebas | Falta `backend/.env` o las variables no fueron cargadas. | Crear `backend/.env` desde `.env.example` y ajustar los valores locales. |
| `Unknown command: pnpm` | pnpm no está instalado o no está en el PATH. | Instalar pnpm y abrir una nueva terminal. |
| `This version of pnpm requires at least Node.js v22.13` | La terminal está usando un Node anterior al requerido por pnpm. | Priorizar Node 22 en el `PATH` o actualizar Node. |
| `/health` no responde | Backend no iniciado o puerto incorrecto. | Ejecutar `pnpm start` en `backend/`. |
| `/health` responde pero la API falla | PostgreSQL no está disponible, variables incompletas o esquema no cargado. | Revisar `backend/.env`, cargar `schema.sql` y consultar logs del backend. |
| Login falla aunque el usuario existe | Contraseña incorrecta, hash inválido o límite de intentos alcanzado. | Verificar registro, datos en `USUARIO` y esperar si hubo demasiados intentos. |
| Frontend no consume API | Backend apagado, URL incorrecta o `CORS_ORIGIN` no incluye el origen del frontend. | Confirmar la API en `http://localhost:3000` y revisar `CORS_ORIGIN`. |

---

## 13. Criterios de Mantenimiento

- Mantener `.env.example` actualizado cuando cambien variables requeridas.
- Mantener `backend/package.json` como referencia de scripts oficiales.
- Usar `pnpm-lock.yaml` para reproducibilidad de dependencias.
- Actualizar esta guía cuando cambien puertos, comandos, gestor de paquetes o pasos de instalación.
- No documentar credenciales reales en archivos versionados.
