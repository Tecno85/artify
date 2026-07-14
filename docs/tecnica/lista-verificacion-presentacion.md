# Lista de verificación para presentar Artify

> **Fecha:** Julio de 2026
>
> **Propósito:** comprobar el despliegue y preparar una demostración académica breve y reproducible.

## 1. Enlaces que voy a utilizar

| Componente | Dirección |
| --- | --- |
| Aplicación | <https://tecno85.github.io/artify/> |
| Salud del backend | <https://artify-sena-postgresql.onrender.com/health> |
| Conexión con PostgreSQL | <https://artify-sena-postgresql.onrender.com/ready> |
| Repositorio | <https://github.com/Tecno85/artify> |
| GitHub Actions | <https://github.com/Tecno85/artify/actions> |

## 2. Preparación antes de presentar

Realizo estas comprobaciones entre 10 y 15 minutos antes de iniciar:

1. Confirmo que tengo conexión a Internet y cierro pestañas que no voy a usar.
2. Abro `/health` y espero que muestre `"ok": true`.
3. Abro `/ready` y espero que muestre `"baseDatos": "disponible"`.
4. Abro Artify y hago una recarga completa de la página.
5. Inicio sesión con una cuenta de demostración creada previamente.
6. Confirmo que el panel administrativo abre con mi cuenta administradora.
7. Dejo preparada una imagen JPG, PNG o WebP menor de 10 MB.
8. Verifico que el navegador permita descargar archivos.
9. No muestro contraseñas, variables de entorno ni la URL privada de PostgreSQL.

También puedo ejecutar desde la raíz del repositorio:

```bash
node scripts/validar-despliegue.js
```

El comando solo consulta recursos públicos; no crea, edita ni elimina datos.

## 3. Orden recomendado de la demostración

### Paso 1. Presento el proyecto

- Muestro la página inicial.
- Explico que el frontend usa HTML, CSS, JavaScript y Canvas API.
- Indico que el backend usa Node.js y Express, y que PostgreSQL conserva los datos.

### Paso 2. Muestro autenticación

- Inicio sesión como usuario normal.
- Explico la redirección por rol y la protección mediante token.
- Si demuestro el registro, uso una cuenta temporal y la elimino al finalizar.

### Paso 3. Muestro el editor

1. Cargo la imagen preparada.
2. Aplico una rotación o un redimensionamiento.
3. Selecciono un filtro, muevo la intensidad y confirmo con **Aplicar filtro**.
4. Muestro deshacer y rehacer.
5. Selecciono PNG, JPEG o WebP.
6. Descargo el resultado y confirmo que el archivo fue generado.

### Paso 4. Muestro recuperación local

- Dejo el autoguardado activado.
- Explico que la última copia puede recuperarse durante siete días en el mismo navegador y para el mismo usuario.
- No necesito forzar el cierre durante una presentación corta; puedo mostrar el modal con una demostración preparada previamente.

### Paso 5. Muestro administración

- Cierro sesión e ingreso con la cuenta administradora.
- Muestro el listado, la búsqueda y los estados de usuario.
- Si creo una cuenta temporal, la edito y la elimino antes de cerrar.
- Evito modificar o eliminar la cuenta administradora actual.

### Paso 6. Muestro calidad técnica

- Abro la pestaña **Actions** de GitHub y muestro la última ejecución aprobada.
- Muestro `/health` y `/ready`.
- Explico que las pruebas usan una base terminada en `_test` y nunca Neon.

## 4. Lista de cierre

- [ ] Eliminé los usuarios temporales de demostración.
- [ ] Cerré la sesión administrativa.
- [ ] Confirmé que no quedaron contraseñas visibles.
- [ ] Guardé las evidencias o capturas solicitadas.
- [ ] Verifiqué que la aplicación pública sigue respondiendo.

## 5. Solución rápida de problemas

| Situación | Acción |
| --- | --- |
| El login tarda al primer intento | Espero a que Render termine su arranque en frío y consulto `/health`. |
| `/health` responde, pero `/ready` falla | Reviso el estado de Neon y `DATABASE_URL` en Render. |
| El frontend carga, pero no consume la API | Reviso `ARTIFY_API_URL`, `CORS_ORIGIN` y la última ejecución de Actions. |
| No se ve el cambio reciente | Hago una recarga completa o pruebo en una ventana privada. |
| La descarga no aparece | Verifico los permisos de descarga del navegador y repito con una imagen pequeña. |
| El editor muestra poco espacio | Maximizo la ventana y uso una resolución útil mínima de 1024 × 600. |

## 6. Alcance de esta lista

Esta lista prepara una demostración académica y una verificación funcional. No reemplaza una auditoría de seguridad, una prueba formal de carga ni un acuerdo de disponibilidad del servicio.
