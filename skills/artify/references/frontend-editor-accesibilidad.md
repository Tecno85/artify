# Frontend, Editor Y Accesibilidad

Leer esta referencia al trabajar en `frontend/`, flujos visibles, almacenamiento de sesión, panel administrativo, editor de imágenes o pruebas del navegador.

## Frontend Seguro

- Preservar la estructura por página y reutilizar primero los iconos de `frontend/assets/icons/`.
- Escapar o renderizar de forma segura datos de usuario o base de datos; evitar valores crudos en `innerHTML` y parámetros inline.
- Revisar estados de carga, vacío, error y éxito cuando cambie una interacción asíncrona.
- Mantener coherentes el contrato API, el manejo de errores y la sesión almacenada.
- Al tocar autenticación, comprobar redirección de administrador a `admin.html` y de usuario a `editor.html`, sesión temporal, sesión recordada y token expirado.

## Editor

- Considerar conjuntamente Canvas, carga y límites de imagen, historial de deshacer y rehacer, zoom, filtros, recorte, redimensionamiento, conversión, descarga, autoguardado y registro de operaciones.
- Preservar la independencia entre cambios aplicados en Canvas, historial local y operaciones registradas en la cuenta.
- Comprobar cancelación, confirmación y reajuste de herramientas que mantienen una vista previa.
- Si cambian formatos o límites admitidos, revisar `frontend/pages/editor.html`, JavaScript del editor, pruebas, `README.md` y documentación relacionada.

## Accesibilidad

Al modificar HTML, CSS, formularios, modales o controles interactivos, comprobar según corresponda:

- HTML semántico, etiquetas y nombres accesibles.
- Navegación por teclado, orden lógico y foco visible.
- Movimiento y restauración del foco en modales, además del cierre con `Escape`.
- Mensajes de error asociados a sus campos y estados comunicados sin depender solo del color.
- Contraste AA para texto y controles relevantes.
- Texto alternativo o tratamiento decorativo correcto para imágenes e iconos.
- Pruebas de accesibilidad y renderizado seguro afectadas.

No considerar completa una mejora visual basada únicamente en inspección estática cuando el flujo requiera interacción en navegador.
