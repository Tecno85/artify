# Plan de Pruebas - Módulo de Autenticación

> **Proyecto:** Artify - Editor de Imágenes Web
> **Módulo evaluado:** Autenticación de usuarios
> **Programa:** Análisis y Desarrollo de Software - SENA
> **Autor:** Iván Darío Madrid Daza
> **Fecha:** Mayo 2026

---

## 1. Objetivo

En este artefacto defino y ejecuto un plan de pruebas para validar el funcionamiento del módulo de autenticación de Artify. Me enfoco en comprobar el inicio de sesión, el tratamiento de credenciales inválidas, la generación del token de acceso y los cambios que se realizan en la base de datos después de un login exitoso.

También verifico que la contraseña del usuario no se almacene en texto plano, sino en formato encriptado mediante `bcrypt`.

---

## 2. Alcance

Este plan de pruebas lo centro exclusivamente en el módulo de autenticación:

- Registro de usuario como paso previo para crear credenciales de prueba.
- Inicio de sesión con credenciales válidas.
- Inicio de sesión con credenciales inválidas.
- Validación del almacenamiento de la contraseña en la base de datos.
- Verificación de actualización de datos de acceso en la tabla `USUARIO`.
- Validación de generación de token después de un login exitoso.

No incluyo pruebas funcionales del editor de imágenes, filtros, recorte, panel de administración ni operaciones avanzadas, excepto cuando sirven como evidencia complementaria para demostrar que la autenticación permite acceder correctamente al sistema.

---

## 3. Ambiente de Pruebas

| Elemento | Descripción |
| --- | --- |
| Sistema | Artify |
| Frontend | HTML, CSS, JavaScript Vanilla |
| Backend | Node.js + Express |
| Base de datos | MySQL |
| Tabla principal | `USUARIO` |
| Herramienta de encriptación | `bcryptjs` |
| Archivo principal evaluado | `backend/controllers/auth.controller.js` |
| Script de base de datos | `database/artify_db.sql` |

---

## 4. Componentes Evaluados

Para realizar las pruebas reviso principalmente el controlador de autenticación y la tabla donde se almacenan los usuarios registrados.

### 4.1 Controlador de autenticación

Archivo:

```text
backend/controllers/auth.controller.js
```

Funciones evaluadas:

- `registro(req, res)`
- `login(req, res)`
- `loginAdmin(req, res)`

### 4.2 Tabla de usuarios

Tabla:

```sql
USUARIO
```

Campo donde se almacena la contraseña:

```sql
usr_contrasena varchar(255) NOT NULL
```

---

## 5. Evidencia Técnica del Cifrado de Contraseña

Al revisar el código del proyecto identifiqué que la contraseña se encripta durante el registro del usuario, antes de ser almacenada en la base de datos.

Ubicación:

```text
backend/controllers/auth.controller.js
```

Fragmento relevante:

```javascript
const hash = bcrypt.hashSync(password, 10);
```

Luego, el valor que se guarda en la base de datos es `hash`, no la contraseña original escrita por el usuario:

```javascript
db.query(
  queryInsertar,
  [nombres, apellidos, cedula, fechaNacimiento, correo, hash],
  callback
);
```

Durante el login observé que el sistema no compara texto plano directamente. En su lugar, usa `bcrypt.compareSync` para comparar la contraseña ingresada por el usuario contra el hash almacenado:

```javascript
const passwordValida = bcrypt.compareSync(password, usuario.usr_contrasena);
```

Esto me permite concluir que la contraseña real no necesita ser desencriptada ni recuperada desde la base de datos.

---

## 6. Casos de Prueba

### CP-001 - Registro de usuario con datos válidos

| Campo | Detalle |
| --- | --- |
| Objetivo | Verificar que el sistema permita crear un usuario válido. |
| Precondición | El correo y la cédula no deben existir previamente en la tabla `USUARIO`. |
| Datos de entrada | Nombres, apellidos, cédula, fecha de nacimiento, correo y contraseña válida. |
| Pasos | Enviar solicitud de registro desde el formulario o API. |
| Resultado esperado | El sistema responde `Registro exitoso` y crea el usuario en la base de datos. |
| Validación en BD | Debe existir un nuevo registro en `USUARIO`. |
| Estado | Aprobado. |

Consulta SQL sugerida:

```sql
SELECT usr_id_usuario, usr_correo, usr_contrasena, usr_fecha_registro
FROM USUARIO
WHERE usr_correo = 'correo_prueba@artify.local';
```

---

### CP-002 - Validar que la contraseña se almacena encriptada

| Campo | Detalle |
| --- | --- |
| Objetivo | Confirmar que la contraseña no se guarda en texto plano. |
| Precondición | Debe existir un usuario registrado. |
| Datos de entrada | Correo del usuario registrado. |
| Pasos | Consultar el campo `usr_contrasena` en la tabla `USUARIO`. |
| Resultado esperado | El valor almacenado debe ser un hash generado por bcrypt. |
| Validación en BD | El valor debe iniciar normalmente con `$2a$` o `$2b$` y no debe coincidir con la contraseña original. |
| Estado | Aprobado. |

Consulta SQL sugerida:

```sql
SELECT usr_correo, usr_contrasena
FROM USUARIO
WHERE usr_correo = 'correo_prueba@artify.local';
```

Ejemplo de resultado esperado:

```text
$2b$10$...
```

Interpretación:

- `$2b$` identifica el algoritmo bcrypt.
- `10` representa el factor de costo utilizado en `bcrypt.hashSync(password, 10)`.
- El resto del valor corresponde al hash generado.

---

### CP-003 - Login con credenciales válidas

| Campo | Detalle |
| --- | --- |
| Objetivo | Verificar que un usuario registrado pueda iniciar sesión. |
| Precondición | El usuario debe existir en la tabla `USUARIO`. |
| Datos de entrada | Correo registrado y contraseña correcta. |
| Pasos | Enviar correo y contraseña al endpoint `/api/login`. |
| Resultado esperado | El sistema responde `Login exitoso`, retorna datos del usuario y genera un token. |
| Validación en BD | Se actualiza `usr_ultimo_acceso` y `usr_sesion_activa` cambia a `1`. |
| Estado | Aprobado. |

Consulta SQL sugerida antes y después del login:

```sql
SELECT usr_correo, usr_ultimo_acceso, usr_sesion_activa
FROM USUARIO
WHERE usr_correo = 'correo_prueba@artify.local';
```

---

### CP-004 - Login con correo no registrado

| Campo | Detalle |
| --- | --- |
| Objetivo | Verificar que el sistema rechace un correo inexistente. |
| Precondición | El correo no debe existir en la base de datos. |
| Datos de entrada | Correo no registrado y cualquier contraseña válida en formato. |
| Pasos | Enviar solicitud de login. |
| Resultado esperado | El sistema responde `Usuario no encontrado`. |
| Código esperado | HTTP 401. |
| Validación en BD | No se modifica ningún registro de la tabla `USUARIO`. |
| Estado | Aprobado. |

---

### CP-005 - Login con contraseña incorrecta

| Campo | Detalle |
| --- | --- |
| Objetivo | Verificar que el sistema rechace una contraseña incorrecta. |
| Precondición | El correo debe existir en la base de datos. |
| Datos de entrada | Correo válido y contraseña incorrecta. |
| Pasos | Enviar solicitud de login. |
| Resultado esperado | El sistema responde `Contraseña incorrecta`. |
| Código esperado | HTTP 401. |
| Validación en BD | No debe actualizarse el acceso del usuario como sesión válida. |
| Estado | Aprobado. |

---

### CP-006 - Login con formato de correo inválido

| Campo | Detalle |
| --- | --- |
| Objetivo | Validar que el backend rechace correos con formato incorrecto. |
| Precondición | Ninguna. |
| Datos de entrada | Correo con formato inválido, por ejemplo `correo-invalido`. |
| Pasos | Enviar solicitud de login. |
| Resultado esperado | El sistema responde `Ingresa un correo válido`. |
| Código esperado | HTTP 400. |
| Validación en BD | No se consulta ni modifica un usuario válido. |
| Estado | Aprobado. |

---

### CP-007 - Generación de token en login exitoso

| Campo | Detalle |
| --- | --- |
| Objetivo | Verificar que el backend entregue un token al autenticar correctamente. |
| Precondición | Usuario registrado y activo. |
| Datos de entrada | Correo y contraseña correctos. |
| Pasos | Ejecutar login. |
| Resultado esperado | La respuesta incluye el campo `token`. |
| Validación adicional | El token contiene información firmada del usuario, como `id`, `correo` y `rol`. |
| Estado | Aprobado. |

---

### CP-008 - Acceso a ruta protegida con token inválido

| Campo | Detalle |
| --- | --- |
| Objetivo | Verificar que el backend rechace tokens manipulados o inválidos. |
| Precondición | Debe existir una ruta protegida por autenticación. |
| Datos de entrada | Encabezado `Authorization` con un token inválido. |
| Pasos | Enviar solicitud a una ruta protegida usando un token incorrecto. |
| Resultado esperado | El sistema rechaza la solicitud y no permite acceder al recurso protegido. |
| Código esperado | HTTP 401. |
| Validación adicional | La respuesta debe indicar que el token está ausente, inválido o expirado. |
| Estado | Aprobado. |

---

## 7. Validaciones Directas en Base de Datos

### 7.1 Consultar usuario registrado

```sql
SELECT usr_id_usuario, usr_nombres, usr_correo, usr_fecha_registro
FROM USUARIO
WHERE usr_correo = 'correo_prueba@artify.local';
```

### 7.2 Verificar hash de contraseña

```sql
SELECT usr_correo, usr_contrasena
FROM USUARIO
WHERE usr_correo = 'correo_prueba@artify.local';
```

Resultado esperado:

```text
La columna usr_contrasena no debe contener la contraseña escrita por el usuario.
Debe contener un hash bcrypt similar a: $2b$10$...
```

### 7.3 Verificar cambios después del login

```sql
SELECT usr_correo, usr_ultimo_acceso, usr_sesion_activa
FROM USUARIO
WHERE usr_correo = 'correo_prueba@artify.local';
```

Resultado esperado después de login exitoso:

```text
usr_ultimo_acceso: fecha y hora actualizada
usr_sesion_activa: 1
```

---

## 8. Evidencias Visuales del Proceso

Como complemento del plan de pruebas, agrego evidencias visuales del proceso de autenticación. Estas imágenes documentan los escenarios principales que validé durante la ejecución de las pruebas: rechazo de acceso, login exitoso, almacenamiento de la contraseña como hash bcrypt y resultado de pruebas automatizadas.

### 8.1 Login fallido

![Login fallido](./evidencias/autenticacion/login-fallido.svg)

### 8.2 Login exitoso

![Login exitoso](./evidencias/autenticacion/login-exitoso-editor.svg)

### 8.3 Hash bcrypt en base de datos

![Hash bcrypt en base de datos](./evidencias/autenticacion/hash-bcrypt-bd.svg)

### 8.4 Resultado de pruebas automatizadas

![Resultado de pruebas automatizadas](./evidencias/autenticacion/pruebas-automatizadas.svg)

---

## 9. Evidencia Automatizada Complementaria

Como apoyo al plan de pruebas manual, también agregué una prueba automatizada de integración en:

```text
backend/tests/api.test.js
```

Actualmente ejecuto 12 pruebas automatizadas que cubren las siguientes validaciones:

- Respuesta del endpoint público de analíticas.
- Rechazo de login con correo inválido.
- Rechazo de login con correo no registrado.
- Registro de usuario temporal.
- Verificación en MySQL de que la contraseña se guarda como hash bcrypt.
- Login exitoso.
- Generación de token.
- Actualización de `usr_ultimo_acceso` y `usr_sesion_activa` después del login.
- Acceso a rutas protegidas con token.
- Rechazo de login con contraseña incorrecta.
- Rechazo de rutas protegidas sin token.
- Rechazo de rutas protegidas con token inválido.
- Rechazo de rutas protegidas con token expirado.
- Rechazo de acceso a recursos de otro usuario.
- Rechazo de identificadores malformados en rutas protegidas.
- Autenticación de administrador.
- Limpieza del usuario temporal en la base de datos.

Comando de ejecución:

```bash
cd backend
pnpm test
```

Resultado obtenido:

```text
12 pruebas ejecutadas
12 pruebas aprobadas
0 pruebas fallidas
```

Con esta evidencia automatizada complemento las pruebas manuales y confirmo que el proyecto valida tanto los flujos correctos como varios escenarios de error comunes en autenticación.

---

## 10. Criterios de Aceptación

Considero aprobado el módulo de autenticación si cumple con los siguientes criterios:

- El usuario puede iniciar sesión con credenciales válidas.
- El sistema rechaza credenciales inválidas.
- El sistema valida el formato del correo antes de autenticar.
- La contraseña se almacena como hash bcrypt y no en texto plano.
- El login exitoso actualiza `usr_ultimo_acceso` y `usr_sesion_activa`.
- El backend genera un token para el usuario autenticado.
- Las rutas protegidas rechazan solicitudes sin token.
- Las rutas protegidas rechazan solicitudes con token inválido.
- Las pruebas automatizadas de integración se ejecutan correctamente.

---

## 11. Conclusiones

Después de realizar este plan de pruebas, concluyo que el módulo de autenticación de Artify cumple con los criterios básicos de seguridad esperados para el proyecto. La contraseña del usuario se encripta antes de almacenarse en la base de datos mediante `bcrypt`, y durante el login se compara la contraseña ingresada contra el hash almacenado.

Las pruebas realizadas me permitieron confirmar que el sistema diferencia correctamente entre credenciales válidas, usuarios inexistentes, contraseñas incorrectas y formatos de correo inválidos. Además, verifiqué que un login exitoso genera un token de autenticación y actualiza información de acceso en la tabla `USUARIO`.

También confirmé mediante pruebas automatizadas que el hash almacenado no coincide con la contraseña original y que las rutas protegidas rechazan solicitudes sin token o con un token inválido. Esto fortalece la evidencia del comportamiento esperado del módulo de autenticación.

Como mejora futura, considero importante mantener las pruebas automatizadas y ampliarlas progresivamente para cubrir recuperación de contraseña, bloqueo por múltiples intentos fallidos y expiración de tokens.
