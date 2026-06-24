# Guía de Despliegue y Ejecución Local

> **Proyecto:** Artify - Editor de Imágenes Web
> **Entorno principal:** Local / desarrollo
> **Backend:** Node.js + Express
> **Frontend:** HTML, CSS y JavaScript Vanilla
> **Base de datos:** MySQL
> **Fecha:** Mayo 2026

---

## 1. Objetivo del Documento

Este documento describe los pasos técnicos necesarios para preparar, ejecutar y verificar Artify en un entorno local. Hace parte del manual técnico y complementa el `README.md`, evitando repetir la descripción general del proyecto.

---

## 2. Requisitos Previos

Antes de ejecutar el proyecto se requiere tener instalado:

| Herramienta | Versión recomendada | Uso |
| --- | --- | --- |
| Node.js | 22.13 o superior | Ejecutar el backend. |
| pnpm | 11.1.1 | Instalar dependencias y ejecutar scripts del backend. |
| MySQL | 8.0 o superior | Base de datos relacional. |
| Git | Versión estable | Clonar y versionar el proyecto. |
| Navegador moderno | Chrome, Edge, Firefox, Safari u Opera | Usar el frontend. |

---

## 3. Clonar el Proyecto

```bash
git clone https://github.com/Tecno85/artify-sena.git
cd artify-sena
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

El backend necesita un archivo `.env` dentro de `backend/`. Se puede crear a partir de `.env.example`.

```bash
cp ../.env.example .env
```

Variables principales:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contrasena_mysql
DB_NAME=artify_db

ADMIN_USER=admin@artify.com
ADMIN_PASSWORD=tu_contrasena_admin

TOKEN_SECRET=un_secreto_largo_y_aleatorio
PORT=3000
NODE_ENV=development
```

### Consideraciones

- `backend/.env` no debe subirse al repositorio.
- `TOKEN_SECRET` debe ser largo y difícil de adivinar.
- `ADMIN_PASSWORD` debe cambiarse por una contraseña segura en cada entorno.

---

## 6. Crear la Base de Datos

El script principal de base de datos se encuentra en:

```text
database/artify_db.sql
```

Desde la raíz del proyecto se puede importar con:

```bash
mysql -u root -p < database/artify_db.sql
```

También se puede ejecutar el script desde MySQL Workbench u otra herramienta compatible.

Al finalizar, debe existir la base de datos:

```text
artify_db
```

---

## 7. Ejecutar el Backend

Desde la carpeta `backend/`:

```bash
pnpm start
```

Salida esperada:

```text
Conectado a MySQL correctamente
Servidor corriendo en http://localhost:3000
```

Para desarrollo con recarga automática:

```bash
pnpm run dev
```

---

## 8. Ejecutar el Frontend

El frontend es estático. Para probar rutas y navegación de forma más estable se recomienda servir la carpeta `frontend/` por HTTP.

Desde la raíz del proyecto:

```bash
npx http-server frontend -p 8080
```

Luego abrir:

```text
http://127.0.0.1:8080
```

También es posible abrir `frontend/index.html` directamente, pero para pruebas completas se recomienda usar servidor local.

---

## 9. Verificar el Funcionamiento

### Verificación del backend

```bash
cd backend
pnpm run check
```

### Pruebas automatizadas

```bash
cd backend
pnpm test
```

La suite actual valida autenticación, rutas protegidas, tokens, configuración básica y limpieza de usuarios temporales.

### Verificación manual básica

1. Abrir `http://127.0.0.1:8080`.
2. Registrar un usuario de prueba.
3. Iniciar sesión.
4. Confirmar redirección al editor.
5. Cargar una imagen.
6. Probar una operación de edición.
7. Descargar la imagen resultante.

---

## 10. Puertos Utilizados

| Servicio | Puerto | Descripción |
| --- | --- | --- |
| Backend Express | `3000` | API principal del sistema. |
| Frontend local | `8080` | Servidor estático recomendado para pruebas. |
| MySQL | `3306` | Puerto habitual de MySQL. |
| Backend de pruebas | `3100` | Puerto usado por la suite automatizada cuando aplica. |

---

## 11. Script de Configuración Inicial

El proyecto incluye un script de apoyo:

```text
scripts/setup.sh
```

Este script instala dependencias del backend y crea `backend/.env` desde `.env.example` si todavía no existe.

Ejecución:

```bash
./scripts/setup.sh
```

Después de ejecutarlo, se debe revisar manualmente `backend/.env` y cargar la base de datos.

---

## 12. Problemas Comunes

| Problema | Posible causa | Solución |
| --- | --- | --- |
| `Error al conectar a MySQL` | Credenciales incorrectas o MySQL detenido. | Revisar `backend/.env` e iniciar MySQL. |
| `Unknown command: pnpm` | pnpm no está instalado o no está en el PATH. | Instalar pnpm y abrir una nueva terminal. |
| API no responde | Backend no iniciado o puerto incorrecto. | Ejecutar `pnpm start` en `backend/`. |
| Login falla aunque el usuario existe | Contraseña incorrecta o hash inválido. | Verificar registro y datos en `USUARIO`. |
| Frontend no consume API | Backend apagado o URL incorrecta. | Confirmar que API esté en `http://localhost:3000`. |

---

## 13. Criterios de Mantenimiento

- Mantener `.env.example` actualizado cuando cambien variables requeridas.
- Mantener `backend/package.json` como referencia de scripts oficiales.
- Usar `pnpm-lock.yaml` para reproducibilidad de dependencias.
- Actualizar esta guía cuando cambien puertos, comandos, gestor de paquetes o pasos de instalación.
- No documentar credenciales reales en archivos versionados.
