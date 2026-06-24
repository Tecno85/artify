# API REST Analytics - Artify

Este módulo expone endpoints que ofrecen información sobre el comportamiento de los usuarios.

---

## ¿Qué es esta API?

Esta API permite que un **e-commerce externo** obtenga datos sobre cómo los usuarios
de Artify editan imágenes. Con estos datos, el e-commerce puede entender qué ediciones
funcionan mejor para vender productos.

**Ejemplo real:**
- Un e-commerce nota que fotos editadas con filtro "convertir" generan 33% del uso
- Instruye a sus vendedores a usar ese filtro
- Sus productos se venden mejor

---

## Endpoints de Analytics

### 1. Filtros Más Usados

**¿Qué hace?**

Devuelve cuál es el filtro más usado por los usuarios de Artify

**URL:** `GET /api/v1/analytics/filtros-populares`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/filtros-populares

**Respuesta:**
```json
{
  "ok": true,
  "mensaje": "Top filtros utilizados",
  "data": {
    "filtros": [
      {
        "filtro": "convertir",
        "usos": 4,
        "porcentaje": 33.33
      },
      {
        "filtro": "recorte",
        "usos": 3,
        "porcentaje": 25.00
      },
      {
        "filtro": "rotar",
        "usos": 2,
        "porcentaje": 16.67
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-21T21:20:21.729Z",
    "totalFiltros": 3
  }
}
```

**¿Qué significan los campos?**
- `filtro` → Nombre del filtro (sepia, blanco y negro, etc.)
- `usos` → Cuántas veces fue usado (4 veces en este caso)
- `porcentaje` → Qué % representa del total (33.33% del total)

**¿Para qué lo usa el e-commerce?**

Sabe que "convertir" es el filtro favorito. Puede entrenar a vendedores a usarlo.

---


### 2. Horarios de Edición

**¿Qué hace?**

Devuelve a qué horas del día los usuarios editan más imágenes

**URL:** `GET /api/v1/analytics/horarios-edicion`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/horarios-edicion

**Respuesta:**
```json
**Respuesta (Ejemplo):**
```json
{
  "ok": true,
  "mensaje": "Horarios pico de edición",
  "data": {
    "horarios": [
      {
        "hora": 9,
        "cantidad_ediciones": 7,
        "porcentaje": 58.33
      },
      {
        "hora": 10,
        "cantidad_ediciones": 4,
        "porcentaje": 33.33
      },
      {
        "hora": 15,
        "cantidad_ediciones": 1,
        "porcentaje": 8.33
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-21T21:20:21.729Z",
    "totalHoras": 3
  }
}
```

**¿Qué significan los campos?**
- `hora` → Hora del día (9 = 9am, 15 = 3pm)
- `cantidad_ediciones` → Cuántas ediciones se hicieron en esa hora
- `porcentaje` → Qué % del total ocurrió en esa hora

**¿Para qué lo usa el e-commerce?**

Sabe que 9am es la hora pico. Puede enviar emails a esa hora o lanzar promociones.

---

### 3. Formatos Preferidos

**¿Qué hace?**

Devuelve qué formato de imagen es el más descargado (PNG, JPG, etc.)

**URL:** `GET /api/v1/analytics/formatos-preferidos`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/formatos-preferidos

**Respuesta:**
```json
{
  "ok": true,
  "mensaje": "Formatos más descargados",
  "data": {
    "formatos": [
      {
        "formato": "jpeg",
        "descargas": 8,
        "porcentaje": 100.00
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-21T21:20:21.729Z",
    "totalFormatos": 1
  }
}
```

**¿Qué significan los campos?**
- `formato` → Extensión del archivo (jpeg, png, webp, etc.)
- `descargas` → Cuántas imágenes fueron descargadas en ese formato
- `porcentaje` → Qué % del total de descargas fue en ese formato

**¿Para qué lo usa el e-commerce?**

Sabe que JPEG es preferido (100%). Puede recomendar JPEG a vendedores.

---

### 4. Tasa de Conversión

**¿Qué hace?**

Calcula qué % de usuarios que empezaron a editar terminaron guardando cambios

**URL:** `GET /api/v1/analytics/tasa-conversion`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/tasa-conversion

**Respuesta:**
```json
{
  "ok": true,
  "mensaje": "Tasa de conversión de sesiones",
  "data": {
    "conversionData": {
      "tasa_conversion_porcentaje": "0.00",
      "total_sesiones": 246,
      "sesiones_exitosas": 0
    }
  },
  "meta": {
    "timestamp": "2026-04-21T21:20:21.729Z"
  }
}
```

**¿Qué significan los campos?**
- `tasa_conversion_porcentaje` → % de sesiones donde se guardaron cambios (0% = ninguno guardó)
- `total_sesiones` → Total de sesiones abiertas (246 sesiones)
- `sesiones_exitosas` → Cuántas llegaron a guardar (0 en este caso)

**¿Para qué lo usa el e-commerce?**

Una tasa 0% significa que hay un problema. Los usuarios abren pero no guardan.
   Esto le ayuda a identificar problemas en la interfaz o UX.

---

## Resumen: ¿Quién consume estos datos?

**El e-commerce externo** llama a estos endpoints para entender:
- Qué ediciones usan los usuarios
- Cuándo editan
- Qué formatos prefieren
- Si realmente completan la tarea

**Resultado:** El e-commerce optimiza su plataforma basado en datos reales.

---

**Creado por:** Iván Darío Madrid Daza
**Programa:** Análisis y Desarrollo de Software - SENA
**Fecha:** Abril 2026
