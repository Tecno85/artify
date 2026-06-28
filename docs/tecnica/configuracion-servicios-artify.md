# Configuración de Servicios, Base de Datos y Software para Artify

> **Proyecto:** Artify - Editor de Imágenes Web  
> **Evidencia:** GA10-220501097-AA5-EV01  
> **Programa:** Análisis y Desarrollo de Software - SENA  
> **Autor:** Iván Darío Madrid Daza  
> **Fecha:** Junio de 2026

---

## 1. Introducción

En este informe documento el proceso de configuración de los servicios necesarios para ejecutar Artify en un equipo cliente o entorno local. Para esta evidencia tomo como referencia una instalación tradicional, sin contenedores, porque este enfoque permite identificar de forma directa la función de PostgreSQL, Node.js, Express, pnpm y el servidor HTTP usado por el frontend.

Configuro la base de datos, el servidor de aplicaciones y las variables de entorno. Después verifico la comunicación entre los componentes mediante consultas SQL, respuestas HTTP, pruebas automatizadas y la carga real de la interfaz en el navegador.

### 1.1 Cobertura de la evidencia

| Requisito solicitado | Desarrollo en el informe |
| --- | --- |
| Especificaciones y pasos para configurar el servidor de base de datos | Secciones 7 y 8 |
| Especificaciones y pasos para configurar el servidor de aplicaciones | Secciones 9 y 10 |
| Especificaciones y pasos para realizar pruebas de funcionamiento | Secciones 11, 12 y 13 |

---

## 2. Objetivo

Documentar y verificar la configuración tradicional del servidor de base de datos PostgreSQL, el servidor de aplicaciones Node.js + Express y el frontend de Artify, incluyendo las variables de entorno, dependencias, puertos y pruebas necesarias para confirmar el funcionamiento local del sistema.

---

## 3. Alcance

En esta evidencia realizo las siguientes actividades:

- Verifico las herramientas instaladas en el equipo.
- Compruebo que el servicio PostgreSQL esté activo.
- Verifico la base de datos `artify_db` y sus tablas.
- Reviso la configuración sanitizada de las variables de entorno.
- Compruebo las dependencias del backend con pnpm.
- Inicio el servidor Node.js + Express.
- Sirvo el frontend mediante HTTP.
- Compruebo la API, la interfaz y las pruebas automatizadas.
- Registro los resultados y problemas comunes.

No utilizo Docker, Docker Compose, máquinas virtuales ni clústeres como parte del procedimiento práctico. Estas tecnologías pueden ser útiles en otros escenarios, pero la actividad se desarrolla mediante una instalación tradicional en el equipo cliente.

---

## 4. Relación con Evidencias Anteriores

Esta evidencia continúa el trabajo técnico realizado previamente:

| Evidencia | Aporte previo | Relación con AA5 |
| --- | --- | --- |
| [AA2 - Verificación de hardware](./verificacion-hardware-artify.md) | Identifiqué los recursos mínimos y recomendados. | Parto de un equipo que cumple los requisitos técnicos. |
| [AA3 - Plan de instalación](./plan-instalacion-artify.md) | Organicé herramientas y pasos de instalación. | Ejecuto y verifico la configuración de los servicios instalados. |
| [AA4 - Alta disponibilidad y clústeres](./alta-disponibilidad-clusteres.md) | Analicé conceptos de disponibilidad y distribución. | Mantengo AA5 en un entorno local tradicional y de una sola instancia. |

Por esta razón, no repito todo el proceso de instalación. Me concentro en demostrar que los servicios quedan configurados, conectados y disponibles para ejecutar Artify.

---

## 5. Arquitectura Configurada

La configuración local mantiene separados los componentes principales de Artify:

1. El navegador solicita el frontend por HTTP en el puerto `8080`.
2. El frontend envía solicitudes a la API de Node.js + Express en el puerto `3000`.
3. El backend procesa la autenticación y la lógica del sistema.
4. El backend se conecta a PostgreSQL mediante las variables del archivo `backend/.env`.
5. PostgreSQL conserva la información persistente en `artify_db` mediante su puerto habitual `5432`.

| Servicio | Dirección o puerto local | Función |
| --- | --- | --- |
| PostgreSQL | `127.0.0.1:5432` | Persistencia de usuarios, configuraciones, imágenes, operaciones y sesiones. |
| Backend Express | `http://localhost:3000` | API, autenticación y acceso a la base de datos. |
| Frontend | `http://127.0.0.1:8080` | Interfaz web usada por el cliente. |

---

## 6. Herramientas Requeridas

Antes de configurar los servicios, verifico que las herramientas respondan desde la terminal.

```bash
node --version
pnpm --version
psql --version
git --version
```

| Herramienta | Función | Versión recomendada | Versión verificada | Estado |
| --- | --- | --- | --- | --- |
| Node.js | Ejecutar el backend. | 22.13 o superior | 26.0.0 | Verificado |
| pnpm | Administrar dependencias y scripts. | 11.1.1 | 11.1.1 | Verificado |
| PostgreSQL | Ejecutar la base de datos. | 15 o superior | 15.18 | Verificado |
| Git | Gestionar el repositorio. | Versión estable | 2.50.1 | Verificado |
| Navegador web | Abrir y probar el frontend. | Navegador moderno | Google Chrome | Verificado |
| Terminal | Ejecutar comandos y servicios. | Incluida en el sistema | Terminal de macOS | Verificado |
| Editor de código | Revisar configuración y archivos. | Editor compatible | Disponible en el equipo | Verificado |

#### Imagen 1. Versiones de las herramientas

![Versiones verificadas de las herramientas](./evidencias/configuracion-servicios/versiones-herramientas.svg)

*Descripción:* En esta evidencia muestro las versiones de Node.js, pnpm, PostgreSQL y Git disponibles en el equipo utilizado para configurar Artify.

---

## 7. Configuración del Servidor de Base de Datos

### 7.1 Verificar e iniciar PostgreSQL

Primero confirmo que PostgreSQL esté instalado:

```bash
psql --version
```

Después inicio el servicio mediante la herramienta correspondiente al sistema operativo. En macOS puedo usar Homebrew o `pg_ctl`, según la instalación:

```bash
brew services start postgresql@15
```

En Windows puedo iniciar el servicio PostgreSQL desde Servicios y, en distribuciones Linux con `systemd`, puedo usar:

```bash
sudo systemctl start postgresql
```

El nombre y la forma de inicio pueden cambiar según la instalación. Para esta evidencia comprobé que el proceso `postgres` estaba activo y aceptaba una conexión autenticada en el puerto local.

#### Imagen 2. Servicio PostgreSQL activo

![Servicio PostgreSQL activo](./evidencias/configuracion-servicios/postgresql-servicio-activo.svg)

*Descripción:* En esta evidencia confirmo que el proceso de PostgreSQL se encuentra activo y que el servidor acepta una conexión autenticada desde el equipo local.

### 7.2 Acceder a PostgreSQL

Ingreso con un usuario autorizado. No escribo la contraseña dentro del comando para evitar que quede visible en el historial:

```bash
psql -h 127.0.0.1 -p 5432 -U usuario -d artify_db
```

Después de ejecutar el comando, PostgreSQL solicita la contraseña de forma interactiva.

### 7.3 Crear la base de datos y cargar el esquema

En PostgreSQL la base de datos debe existir antes de cargar `schema.sql`. Primero creo la base:

```bash
createdb artify_db
```

Después cargo el esquema oficial del proyecto:

```text
database/postgresql/schema.sql
```

Desde la raíz del proyecto ejecuto:

```bash
psql -d artify_db -f database/postgresql/schema.sql
psql -d artify_db -f database/postgresql/seed.sql
```

El archivo `schema.sql` crea tablas, claves, restricciones, índices y la vista principal dentro de `artify_db`. El archivo `seed.sql` carga datos mínimos de referencia. Antes de ejecutar nuevamente estos scripts debo comprobar el estado de la base existente y realizar una copia de seguridad si contiene información necesaria, porque el esquema elimina y vuelve a crear los objetos del proyecto.

### 7.4 Verificar la base y sus tablas

Ejecuto las siguientes consultas:

```sql
\l
\c artify_db
\dt
\dv
```

La verificación realizada encontró los siguientes objetos:

- `CONFIGURACION`
- `IMAGEN`
- `OPERACION`
- `SESION_EDICION`
- `USUARIO`
- `v_usuarios_activos`

#### Imagen 3. Base de datos `artify_db`

![Base de datos artify_db verificada](./evidencias/configuracion-servicios/postgresql-base-artify.svg)

*Descripción:* En esta evidencia presento el resultado de seleccionar `artify_db` y consultar sus tablas y vista principal.

---

## 8. Especificaciones de Conexión con PostgreSQL

Para que el backend se conecte correctamente, verifico los siguientes elementos:

| Elemento | Especificación |
| --- | --- |
| Servicio | PostgreSQL 15 o superior. |
| Host local | `localhost` o `127.0.0.1`. |
| Puerto habitual | `5432`. |
| Base de datos | `artify_db`. |
| Usuario | Usuario de PostgreSQL con acceso a la base. |
| Contraseña | Credencial local protegida. |
| Controlador de Node.js | `pg`. |
| Codificación del esquema | `UTF8`. |

Confirmo que las credenciales definidas en `backend/.env` correspondan con un usuario real de PostgreSQL y que dicho usuario pueda consultar y modificar los objetos requeridos por Artify.

---

## 9. Configuración del Servidor de Aplicaciones

### 9.1 Abrir el proyecto

Si el repositorio aún no está disponible en el equipo cliente, puedo obtenerlo con:

```bash
git clone https://github.com/Tecno85/artify-sena-postgresql.git
cd artify-sena-postgresql
```

En esta evidencia trabajo sobre el repositorio local existente.

### 9.2 Configurar las variables de entorno

El proyecto incluye `.env.example` como referencia. Creo el archivo local dentro de `backend/`:

```bash
cp .env.example backend/.env
```

Si ejecuto el comando desde la carpeta `backend/`, uso `cp ../.env.example .env`.

Luego reemplazo los valores de ejemplo por la configuración del equipo, sin publicar credenciales reales.

| Variable | Descripción | Ejemplo sanitizado | Observación |
| --- | --- | --- | --- |
| `DB_HOST` | Dirección del servidor PostgreSQL. | `localhost` | Puede usarse `127.0.0.1` según la conexión. |
| `DB_USER` | Usuario autorizado en PostgreSQL. | `usuario_artify` | No debe publicarse si identifica una cuenta real. |
| `DB_PASSWORD` | Contraseña del usuario de PostgreSQL. | `********` | Valor sensible. |
| `DB_NAME` | Base de datos usada por el proyecto. | `artify_db` | Debe coincidir con el esquema importado. |
| `DATABASE_URL` | Cadena completa de conexión PostgreSQL. | `postgresql://usuario:********@host:5432/artify_db` | Es la opción principal para despliegues como Render o Neon. |
| `ADMIN_USER` | Correo del administrador de Artify. | `admin@ejemplo.com` | Dato de acceso administrativo. |
| `ADMIN_PASSWORD` | Contraseña administrativa. | `********` | Debe ser segura y diferente entre entornos. |
| `TOKEN_SECRET` | Secreto para firmar tokens. | `********` | Debe ser largo, aleatorio y privado. |
| `PORT` | Puerto del backend. | `3000` | Debe estar disponible. |
| `NODE_ENV` | Tipo de entorno. | `development` | En producción debe configurarse como corresponda. |
| `CORS_ORIGIN` | Orígenes autorizados para consumir la API. | `http://localhost:8080` | En producción debe coincidir con la URL pública del frontend. |

#### Imagen 4. Variables de entorno

![Variables de entorno configuradas y sanitizadas](./evidencias/configuracion-servicios/env-configurado.svg)

*Descripción:* En esta evidencia represento la estructura del archivo `backend/.env`. Las credenciales y secretos se ocultan completamente.

### 9.3 Instalar o comprobar dependencias

Entro a la carpeta del backend y uso el gestor definido por el proyecto:

```bash
cd backend
pnpm install --frozen-lockfile
```

La opción `--frozen-lockfile` comprueba que las dependencias correspondan con `pnpm-lock.yaml`. En la ejecución realizada, las dependencias ya estaban al día.

También verifico la sintaxis del archivo principal:

```bash
pnpm run check
```

### 9.4 Iniciar el servidor

Desde `backend/` ejecuto:

```bash
pnpm start
```

La salida esperada es:

```text
Servidor corriendo en http://localhost:3000
Conectado a PostgreSQL correctamente
```

Esta salida confirma que Express está escuchando en el puerto configurado y que `pg` pudo establecer la conexión con `artify_db`.

#### Imagen 5. Dependencias y pruebas del backend

![Dependencias y pruebas del backend verificadas](./evidencias/configuracion-servicios/dependencias-pruebas.svg)

*Descripción:* En esta evidencia muestro que el lockfile y las dependencias se encuentran al día, la sintaxis es válida y las trece pruebas automatizadas finalizaron correctamente.

#### Imagen 6. Backend conectado y API disponible

![Backend de Artify y API funcionando](./evidencias/configuracion-servicios/backend-api.svg)

*Descripción:* En esta evidencia confirmo que el backend se conectó a PostgreSQL, escuchó en el puerto `3000` y respondió una solicitud de la API con estado HTTP `200`.

---

## 10. Configuración del Frontend

El frontend está construido con HTML, CSS y JavaScript Vanilla. Para probar rutas y solicitudes desde un origen HTTP, lo sirvo desde la raíz del proyecto:

```bash
npx http-server frontend -p 8080
```

Después abro:

```text
http://127.0.0.1:8080
```

Compruebo los siguientes puntos:

- La página inicial carga sin errores visibles.
- Los recursos CSS, JavaScript e imágenes aparecen correctamente.
- Los enlaces de inicio de sesión y registro están disponibles.
- El frontend puede comunicarse con la API local en el puerto `3000`.
- El backend y PostgreSQL permanecen activos durante las pruebas.

#### Imagen 7. Frontend de Artify

![Frontend real de Artify abierto en el navegador](./evidencias/configuracion-servicios/frontend-artify.png)

*Descripción:* En esta captura real evidencio que la página inicial de Artify se encuentra disponible mediante el servidor HTTP local en el puerto `8080`.

---

## 11. Pruebas de Funcionamiento

### 11.1 Prueba de la API

Realizo primero una solicitud al endpoint de salud del backend:

```bash
curl http://127.0.0.1:3000/health
```

La respuesta esperada contiene `ok: true` y confirma que Express está activo sin depender de una consulta a PostgreSQL.

Después realizo una solicitud a un endpoint público que sí consulta información de la base de datos:

```bash
curl http://127.0.0.1:3000/api/v1/analytics/filtros-populares
```

La prueba devolvió estado HTTP `200` y una respuesta JSON con `ok: true`. Esto confirma que Express procesa solicitudes y consulta información de la base de datos.

### 11.2 Prueba automatizada del backend

Ejecuto:

```bash
cd backend
pnpm test
```

El resultado obtenido fue:

```text
tests 13
pass 13
fail 0
```

La suite comprobó:

- Respuesta del endpoint público de salud.
- Respuesta del endpoint público de analítica.
- Validación de correos.
- Registro y login de usuario.
- Rechazo de correos o cédulas duplicados.
- Rechazo de contraseñas incorrectas.
- Protección de rutas con token.
- Rechazo de tokens inválidos o expirados.
- Separación de recursos entre usuarios.
- Autenticación administrativa.
- Limpieza de los usuarios temporales creados durante la prueba.

### 11.3 Prueba del frontend

Compruebo la página inicial mediante el navegador y mediante una solicitud HTTP:

```bash
curl -I http://127.0.0.1:8080/
```

El frontend respondió con estado HTTP `200` y mostró correctamente la interfaz principal.

---

## 12. Tabla de Verificación

| Elemento verificado | Resultado esperado | Evidencia | Estado |
| --- | --- | --- | --- |
| Herramientas del equipo | Node.js, pnpm, PostgreSQL y Git disponibles. | Evidencia 1 | Verificado |
| Servicio PostgreSQL | Proceso activo y conexión autenticada. | Evidencia 2 | Verificado |
| Base de datos | `artify_db` seleccionada y objetos disponibles. | Evidencia 3 | Verificado |
| Variables de entorno | Archivo local completo y valores sensibles protegidos. | Evidencia 4 | Verificado |
| Dependencias | Lockfile consistente y paquetes al día. | Evidencia 5 | Verificado |
| Sintaxis del backend | `pnpm run check` finaliza sin errores. | Evidencia 5 | Verificado |
| Pruebas automatizadas | Trece pruebas aprobadas y cero fallos. | Evidencia 5 | Verificado |
| Servidor de aplicaciones | Express activo en el puerto `3000`. | Evidencia 6 | Verificado |
| Conexión backend-PostgreSQL | Mensaje de conexión correcta al iniciar. | Evidencia 6 | Verificado |
| Endpoint de salud | Respuesta HTTP `200` y JSON válido en `/health`. | Evidencia 6 | Verificado |
| Endpoint de la API | Respuesta HTTP `200` y JSON válido en analytics. | Evidencia 6 | Verificado |
| Servidor del frontend | Interfaz disponible en el puerto `8080`. | Evidencia 7 | Verificado |
| Flujo de autenticación | Registro y login aprobados por la suite. | Evidencia 5 | Verificado |
| Limpieza de datos temporales | Usuarios de prueba eliminados por la suite. | Resultado de `pnpm test` | Verificado |

---

## 13. Criterios de Aceptación

Considero que la configuración cumple la evidencia cuando:

1. PostgreSQL se encuentra activo y `artify_db` puede seleccionarse.
2. Las tablas y la vista del proyecto están disponibles.
3. El archivo `backend/.env` contiene todas las variables requeridas.
4. Las dependencias corresponden con `pnpm-lock.yaml`.
5. El backend inicia y establece conexión con PostgreSQL.
6. La API responde por el puerto `3000`.
7. El frontend carga por HTTP en el puerto `8080`.
8. Las pruebas automatizadas finalizan sin fallos.
9. No se exponen credenciales, contraseñas ni secretos.

---

## 14. Consideraciones de Seguridad

Durante la configuración aplico las siguientes medidas:

- No subo `backend/.env` al repositorio.
- Mantengo `.env.example` como plantilla sin credenciales reales.
- No escribo contraseñas directamente en comandos almacenados o capturas.
- Oculto `DB_USER`, `DB_PASSWORD`, `ADMIN_USER`, `ADMIN_PASSWORD` y `TOKEN_SECRET` en las evidencias.
- Uso un `TOKEN_SECRET` largo, aleatorio y diferente para cada entorno.
- Verifico que las contraseñas de usuarios se almacenen mediante hash de bcryptjs.
- Limito las credenciales de PostgreSQL a los permisos necesarios para la aplicación.
- Mantengo Node.js, pnpm, PostgreSQL y dependencias en versiones compatibles y actualizadas.
- No publico puertos de desarrollo directamente en Internet.

---

## 15. Problemas Comunes y Solución

| Problema | Posible causa | Verificación y solución |
| --- | --- | --- |
| PostgreSQL no inicia | Servicio detenido, permisos o error del directorio de datos. | Revisar el servicio y el registro de errores de PostgreSQL; iniciarlo con la herramienta del sistema. |
| `Can't connect to PostgreSQL server` | Host, puerto o servicio incorrectos. | Confirmar `DB_HOST`, puerto `5432` y estado de `postgres`. |
| `password authentication failed` | Usuario o contraseña incorrectos. | Revisar credenciales sin publicarlas y comprobar permisos sobre `artify_db`. |
| `database does not exist` | La base no fue creada o `DB_NAME` es incorrecto. | Crear la base y confirmar con `\l`. |
| No aparecen tablas | No se cargó el esquema o se conectó a otra base. | Ejecutar `\c artify_db` y `\dt`. |
| `pnpm: command not found` | pnpm no está instalado o no está en el `PATH`. | Instalar la versión indicada y abrir una terminal nueva. |
| Dependencias faltantes | No se ejecutó `pnpm install`. | Ejecutar el comando dentro de `backend/`. |
| El puerto `3000` está ocupado | Otro proceso usa el puerto del backend. | Detener el proceso o definir otro `PORT` y actualizar la configuración del frontend. |
| `/health` no responde | Backend detenido o puerto incorrecto. | Ejecutar `pnpm start` dentro de `backend/` y revisar logs. |
| `/health` responde pero analytics falla | PostgreSQL detenido, variables incompletas o esquema sin cargar. | Revisar `backend/.env`, conexión PostgreSQL y objetos de `artify_db`. |
| El frontend no consume la API | Backend detenido, dirección incorrecta o CORS mal configurado. | Confirmar la API en `http://localhost:3000` y revisar `CORS_ORIGIN`. |
| Login o registro falla | Error de conexión, datos inválidos o esquema incompleto. | Revisar terminal del backend, tabla `USUARIO` y respuesta de la API. |
| Las pruebas fallan | Servicio PostgreSQL detenido o variables incompletas. | Iniciar PostgreSQL, revisar `backend/.env` y ejecutar nuevamente `pnpm test`. |

---

## 16. Conclusión

Después de realizar la configuración, concluyo que Artify puede ejecutarse correctamente mediante una instalación tradicional en un equipo cliente. La base de datos `artify_db`, el servidor PostgreSQL, el backend Node.js + Express y el frontend web quedaron disponibles y comunicados mediante los puertos definidos para el entorno local.

La verificación práctica me permitió comprender cómo las variables de entorno conectan el backend con PostgreSQL, cómo pnpm mantiene las dependencias y cómo las pruebas comprueban el registro, el inicio de sesión, los tokens y las rutas protegidas. También confirmé que la interfaz puede abrirse desde el navegador y que la API responde correctamente.

Este procedimiento prepara el proyecto para que otro desarrollador o compañero pueda instalarlo, configurarlo y comprobar su funcionamiento sin depender de contenedores.

---

## 17. Referencias Básicas

- Node.js Documentation. Documentación oficial del entorno de ejecución Node.js.
- Express Documentation. Documentación oficial del framework Express.
- pnpm Documentation. Documentación oficial del gestor de paquetes pnpm.
- PostgreSQL Reference Manual. Documentación oficial de PostgreSQL.
- Git Documentation. Documentación oficial del sistema de control de versiones Git.
- dotenv Documentation. Referencia para el uso de variables de entorno en Node.js.
- Mozilla Developer Network. Referencias sobre HTTP, JavaScript y aplicaciones web.
- SENA. Material de formación sobre configuración de servicios, bases de datos y software.
