# Base de Datos de Artify

> **Proyecto:** Artify - Editor de Imágenes Web
> **Base de datos:** `artify_db`
> **Motor:** MySQL
> **Script principal:** `database/artify_db.sql`
> **Fecha:** Mayo 2026

---

## 1. Objetivo del Documento

Este documento describe la estructura de la base de datos de Artify, sus tablas principales, relaciones y consideraciones de seguridad. Hace parte del manual técnico del proyecto y sirve como referencia para instalación, mantenimiento y futuras mejoras.

---

## 2. Vista General

Artify utiliza una base de datos relacional MySQL llamada `artify_db`. Su función es almacenar usuarios, sesiones de edición, operaciones realizadas, configuraciones personalizadas y metadatos de imágenes.

La tabla principal del modelo es `USUARIO`. Las demás tablas se relacionan con ella para conservar trazabilidad de la actividad del usuario dentro del sistema.

```text
USUARIO
├── CONFIGURACION
├── IMAGEN
├── SESION_EDICION
└── OPERACION
```

---

## 3. Tablas Principales

| Tabla | Propósito |
| --- | --- |
| `USUARIO` | Almacena usuarios, credenciales, rol, estado y datos de acceso. |
| `CONFIGURACION` | Guarda preferencias personalizadas de cada usuario. |
| `IMAGEN` | Registra metadatos de imágenes procesadas por usuarios. |
| `SESION_EDICION` | Registra sesiones de trabajo dentro del editor. |
| `OPERACION` | Guarda operaciones realizadas durante una sesión de edición. |

---

## 4. Tabla `USUARIO`

`USUARIO` es la entidad fuerte del modelo. Desde esta tabla se relacionan los demás registros asociados a la actividad del sistema.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `usr_id_usuario` | `int` | Identificador primario autoincremental. |
| `usr_nombres` | `varchar(100)` | Nombres del usuario. |
| `usr_apellidos` | `varchar(100)` | Apellidos del usuario. |
| `usr_cedula` | `varchar(20)` | Documento único del usuario. |
| `usr_fecha_nacimiento` | `date` | Fecha de nacimiento. |
| `usr_correo` | `varchar(150)` | Correo único usado para autenticación. |
| `usr_contrasena` | `varchar(255)` | Hash de la contraseña generado con `bcrypt`. |
| `usr_fecha_registro` | `datetime` | Fecha de creación del usuario. |
| `usr_ultimo_acceso` | `datetime` | Fecha del último login exitoso. |
| `usr_sesion_activa` | `tinyint(1)` | Indicador de sesión activa. |
| `usr_estado_usuario` | `enum` | Estado: `activo`, `inactivo` o `suspendido`. |
| `usr_rol` | `enum` | Rol: `usuario` o `admin`. |

### Restricciones

- Clave primaria: `usr_id_usuario`.
- Valores únicos: `usr_cedula`, `usr_correo`.
- Rol por defecto: `usuario`.
- Estado por defecto: `activo`.

---

## 5. Tabla `CONFIGURACION`

Almacena preferencias de usuario para personalizar la experiencia dentro del editor.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `cfg_id_configuracion` | `int` | Identificador primario. |
| `cfg_usr_id_usuario` | `int` | Usuario propietario de la configuración. |
| `cfg_tema` | `enum` | Tema visual: `claro`, `oscuro` o `auto`. |
| `cfg_idioma` | `varchar(10)` | Idioma preferido. |
| `cfg_atajos_teclado` | `json` | Campo reservado en el modelo; no usado actualmente por la aplicación. |
| `cfg_mostrar_ayudas` | `tinyint(1)` | Indicador para mostrar ayudas. |
| `cfg_calidad_exportacion` | `enum` | Calidad: `baja`, `media`, `alta`, `maxima`. |
| `cfg_configuracion_avanzada` | `json` | Preferencias avanzadas usadas por el sistema. |
| `cfg_fecha_actualizacion` | `datetime` | Fecha de última actualización. |

### Relación

- `cfg_usr_id_usuario` referencia a `USUARIO.usr_id_usuario`.
- La relación usa `ON DELETE CASCADE` y `ON UPDATE CASCADE`.
- Existe una restricción única sobre `cfg_usr_id_usuario`, por lo que cada usuario tiene una configuración principal.

---

## 6. Tabla `IMAGEN`

Registra metadatos de las imágenes procesadas por los usuarios.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `img_id_imagen` | `int` | Identificador primario. |
| `img_usr_id_usuario` | `int` | Usuario propietario de la imagen. |
| `img_nombre_original` | `varchar(255)` | Nombre original del archivo. |
| `img_nombre_archivo` | `varchar(255)` | Nombre usado por el sistema. |
| `img_formato` | `varchar(50)` | Formato de la imagen. |
| `img_ancho_original` | `int` | Ancho original. |
| `img_alto_original` | `int` | Alto original. |
| `img_tamano_bytes` | `bigint` | Tamaño del archivo en bytes. |
| `img_hash_archivo` | `varchar(255)` | Hash opcional del archivo. |
| `img_fecha_subida` | `datetime` | Fecha de registro. |
| `img_fecha_modificacion` | `datetime` | Fecha de modificación. |
| `img_estado_imagen` | `enum` | Estado: `activa`, `archivada`, `eliminada`. |

### Relación

- `img_usr_id_usuario` referencia a `USUARIO.usr_id_usuario`.
- La relación usa `ON DELETE CASCADE` y `ON UPDATE CASCADE`.

---

## 7. Tabla `SESION_EDICION`

Registra las sesiones de trabajo de los usuarios dentro del editor.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `ses_id_sesion` | `int` | Identificador primario. |
| `ses_usr_id_usuario` | `int` | Usuario asociado a la sesión. |
| `ses_img_id_imagen` | `int` | Imagen asociada, cuando aplica. |
| `ses_fecha_inicio` | `datetime` | Fecha de inicio. |
| `ses_fecha_fin` | `datetime` | Fecha de cierre. |
| `ses_duracion_minutos` | `int` | Duración registrada. |
| `ses_estado_sesion` | `enum` | Estado: `activa`, `pausada`, `finalizada`, `cancelada`. |
| `ses_cambios_guardados` | `tinyint(1)` | Indica si hubo cambios guardados. |
| `ses_numero_operaciones` | `int` | Cantidad de operaciones registradas. |

### Relaciones

- `ses_usr_id_usuario` referencia a `USUARIO.usr_id_usuario`.
- `ses_img_id_imagen` referencia a `IMAGEN.img_id_imagen`.

---

## 8. Tabla `OPERACION`

Registra las acciones realizadas por un usuario durante una sesión de edición.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `opr_id_operacion` | `int` | Identificador primario. |
| `opr_ses_id_sesion` | `int` | Sesión asociada. |
| `opr_usr_id_usuario` | `int` | Usuario que realiza la operación. |
| `opr_tipo_operacion` | `varchar(100)` | Tipo de operación realizada. |
| `opr_parametros` | `json` | Parámetros usados en la operación. |
| `opr_fecha_hora` | `datetime` | Fecha y hora de ejecución. |
| `opr_orden_secuencial` | `int` | Orden de la operación dentro de la sesión. |
| `opr_estado_operacion` | `enum` | Estado: `completada`, `revertida`, `error`. |
| `opr_tiempo_ejecucion_ms` | `int` | Tiempo de ejecución opcional. |

### Relaciones

- `opr_ses_id_sesion` referencia a `SESION_EDICION.ses_id_sesion`.
- `opr_usr_id_usuario` referencia a `USUARIO.usr_id_usuario`.

---

## 9. Vista `v_usuarios_activos`

La base de datos incluye la vista `v_usuarios_activos`, orientada a consultar un resumen de usuarios activos con información agregada.

Campos principales:

- `usr_id_usuario`
- `nombre_completo`
- `usr_correo`
- `usr_fecha_registro`
- `usr_ultimo_acceso`
- `usr_sesion_activa`
- `total_imagenes`
- `total_sesiones`

Esta vista se basa en `USUARIO`, `IMAGEN` y `SESION_EDICION`.

---

## 10. Consideraciones de Seguridad

- La contraseña no se almacena en texto plano.
- El campo `usr_contrasena` guarda un hash generado con `bcrypt`.
- Los campos `usr_correo` y `usr_cedula` tienen restricciones únicas para evitar duplicados.
- Las operaciones protegidas deben validarse desde el backend antes de consultar o modificar la base de datos.
- El archivo `.env` debe permanecer fuera del repositorio porque contiene credenciales de conexión.

---

## 11. Instalación de la Base de Datos

Para crear la base de datos se utiliza el script:

```text
database/artify_db.sql
```

El flujo recomendado es:

1. Abrir MySQL Workbench, terminal MySQL o una herramienta equivalente.
2. Ejecutar el script `database/artify_db.sql`.
3. Confirmar que se cree la base de datos `artify_db`.
4. Configurar las variables de conexión en `backend/.env`.

Variables principales:

```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contrasena_mysql
DB_NAME=artify_db
```

---

## 12. Criterios de Mantenimiento

- Mantener `database/artify_db.sql` como fuente principal del esquema.
- Actualizar este documento cuando cambien tablas, campos, relaciones o vistas.
- No guardar credenciales reales dentro del script SQL ni en archivos versionados.
- Verificar relaciones antes de eliminar usuarios o registros dependientes.
- Mantener la compatibilidad entre controladores backend y estructura de tablas.
