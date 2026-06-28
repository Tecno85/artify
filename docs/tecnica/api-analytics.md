# API REST Analytics - Artify SENA PostgreSQL

Este módulo expone endpoints que ofrecen información agregada sobre el comportamiento de los usuarios. En esta variante los datos se consultan desde PostgreSQL mediante el backend Node.js + Express.

---

## ¿Qué es esta API?

Esta API permite que un sistema externo obtenga datos agregados sobre cómo los usuarios de Artify editan imágenes. Los endpoints son públicos en la versión actual y devuelven conteos y porcentajes como valores numéricos.

**Ejemplo de uso:**
- Un e-commerce nota que fotos editadas con filtro "convertir" generan 33% del uso
- Instruye a sus vendedores a usar ese filtro
- Sus productos se venden mejor

---

## Endpoints de Analytics

### 1. Filtros Más Usados

**¿Qué hace?**

Devuelve los tipos de operación más usados por los usuarios de Artify.

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
- `filtro` representa el tipo de operación registrada.
- `usos` indica cuántas veces aparece esa operación.
- `porcentaje` indica qué proporción representa frente al total consultado.

**¿Para qué lo usa el e-commerce?**

Identifica qué operaciones son más frecuentes y puede orientar recomendaciones de edición.

---


### 2. Horarios de Edición

**¿Qué hace?**

Devuelve a qué horas del día los usuarios editan más imágenes

**URL:** `GET /api/v1/analytics/horarios-edicion`

**¿Cómo lo llamo?**

http://localhost:3000/api/v1/analytics/horarios-edicion

**Respuesta:**
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
- `hora` representa la hora del día en formato de 24 horas.
- `cantidad_ediciones` indica cuántas operaciones se registraron en esa hora.
- `porcentaje` indica qué proporción del total ocurrió en esa hora.

**¿Para qué lo usa el e-commerce?**

Permite identificar horarios de mayor actividad para planear campañas o soporte.

---

### 3. Formatos Preferidos

**¿Qué hace?**

Devuelve qué formato de imagen es el más registrado como descarga o salida preferida.

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
- `formato` representa la extensión del archivo.
- `descargas` indica cuántas imágenes fueron registradas en ese formato.
- `porcentaje` indica qué proporción del total corresponde a ese formato.

**¿Para qué lo usa el e-commerce?**

Ayuda a definir recomendaciones sobre formato de salida.

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
      "tasa_conversion_porcentaje": 0,
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
- `tasa_conversion_porcentaje` indica el porcentaje de sesiones donde se guardaron cambios.
- `total_sesiones` indica el total de sesiones registradas.
- `sesiones_exitosas` indica cuántas sesiones llegaron a guardar cambios.

**¿Para qué lo usa el e-commerce?**

Una tasa baja ayuda a identificar posibles problemas de experiencia o abandono en el flujo de edición.

---

## Resumen: ¿Quién consume estos datos?

Un sistema externo llama a estos endpoints para entender:
- Qué ediciones usan los usuarios
- Cuándo editan
- Qué formatos prefieren
- Si realmente completan la tarea

**Resultado:** el sistema consumidor puede optimizar recomendaciones o decisiones con base en datos reales.

---

**Creado por:** Iván Darío Madrid Daza
**Programa:** Análisis y Desarrollo de Software - SENA
**Fecha:** Abril 2026
