# Matriz de validación del frontend

> **Fecha:** 14 de julio de 2026
>
> **Alcance:** revisión local del layout, controles principales y accesibilidad

## Objetivo

En esta matriz registro las combinaciones que probé en un navegador real. La
medida importante es el área útil del navegador, no las pulgadas físicas del
monitor. Dos pantallas de 24 y 29 pulgadas pueden mostrar el mismo layout si su
ventana tiene la misma resolución CSS.

## Navegadores y tamaños

| Motor probado | 1024 × 600 | 1366 × 768 | 1920 × 1080 |
| --- | --- | --- | --- |
| Chromium | Login | Inicio, login, registro y editor | Login, registro y editor |
| Firefox | — | Inicio, login, registro y editor | — |
| WebKit | — | Inicio, login, registro y editor | — |

## Resultados

| Vista o flujo | Resultado |
| --- | --- |
| Inicio | Sin desplazamiento horizontal ni vertical en 1366 × 768. |
| Login | Cabe completo sin scroll en 1024 × 600, 1366 × 768 y 1920 × 1080. |
| Registro | Conserva una columna y no tiene desplazamiento horizontal; el scroll vertical es esperado por la longitud del formulario. |
| Editor | Sin desbordamiento en 1366 × 768 y 1920 × 1080. |
| Filtros | Blanco y negro mostró vista previa al mover la intensidad y creó una operación solo al confirmar. |
| Historial | Deshacer y rehacer respondieron después de confirmar el filtro. |
| Transformaciones | Rotación, redimensionamiento y recorte actualizaron el lienzo. |
| Conversión | Los selectores PNG, JPEG y WebP, y las calidades alta, media y baja, fueron visibles en los tres motores. |
| Descarga | Se generó localmente un archivo PNG editado. |

Para probar el editor sin modificar datos de producción utilicé una sesión local
simulada y el backend detenido. Por esa razón aparecieron en la consola errores
de conexión esperados; no se interpretaron como fallos visuales. La validación
del despliegue y la API se realizó por separado con
`node scripts/validar-despliegue.js`.

## Accesibilidad revisada

- Los modales principales del editor y del panel administrativo declaran
  `role="dialog"`, `aria-modal="true"` y un título accesible.
- Los mensajes dinámicos importantes usan regiones anunciables.
- El cierre de los modales administrativos tiene nombre accesible.
- Al abrir un modal, el foco entra en un control útil, Tab permanece dentro
  del diálogo, Escape lo cierra y el foco vuelve al control que lo abrió.
- La recuperación de contraseña se presenta como función no disponible y no
  como un enlace que no hace nada.

La suite con `node:test` comprueba estas reglas estructurales y la prueba E2E en
Chromium valida foco, Escape y retorno del foco en los modales de configuración
y administración de usuarios.
Esta revisión no es una auditoría WCAG completa: todavía sería conveniente
probar lector de pantalla y contraste con herramientas especializadas antes de
declarar conformidad formal.

## Cómo repetirla

1. Inicio el frontend local según `plan-instalacion-artify.md`.
2. Abro las herramientas de desarrollo del navegador.
3. Ajusto el viewport a cada tamaño de la tabla.
4. Confirmo que no exista desplazamiento horizontal.
5. Repito registro, login y el flujo principal del editor.
6. Registro navegador, tamaño, fecha y cualquier diferencia encontrada.

El flujo automatizado principal se repite desde `backend/` con:

```bash
pnpm run test:e2e
```
