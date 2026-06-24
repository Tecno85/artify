// ========== VARIABLES GLOBALES ==========
let currentImage = null;
let canvas;
let ctx;
let operationsHistory = [];
let historyIndex = -1;
let currentTool = null;
let zoomLevel = 100;
let currentFilter = null;
let formatoActual = null; // Formato actual de la imagen después de conversión
let calidadActual = null; // Calidad actual de la imagen después de conversión

// ========== ELEMENTOS DEL DOM ==========
let fileInput, btnSubir, btnDescargar, dropZone, canvasWrapper, imageInfo;
let btnRecortar, btnRedimensionar, btnRotar, btnFiltros, submenuFiltros;
let btnDeshacer, btnRehacer;
let btnZoomIn, btnZoomOut, zoomLevelDisplay;
let operationsCount;

// Variables para recorte
let cropMode = false;
let cropArea = { x: 0, y: 0, width: 0, height: 0 };
let isDragging = false;
let startX, startY;
let cropRatio = 'free'; // Proporción actual del recorte

// ========== CONSTANTES DE RESOLUCIÓN ==========
const RESOLUCION_MINIMA_ANCHO = 1366;
const RESOLUCION_MINIMA_ALTO = 768;
const LOCAL_STORAGE_KEY = 'artify_no_mostrar_modal_resolucion';

// ========== FUNCIÓN CRÍTICA: SINCRONIZAR IMAGEN Y CANVAS ==========
function sincronizarImagenYCanvas(callback) {
  console.log('🔄 Sincronizando imagen y canvas');

  // Crear blob del canvas actual
  canvas.toBlob(
    (blob) => {
      if (!blob) {
        console.error('❌ Error al crear blob');
        if (callback) callback();
        return;
      }

      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        currentImage = img;

        console.log('✅ Imagen sincronizada:', img.width, 'x', img.height);

        // Asegurar que canvas y currentImage tienen las mismas dimensiones
        if (canvas.width !== img.width || canvas.height !== img.height) {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        // Redibujar
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImage, 0, 0);

        if (callback) {
          requestAnimationFrame(callback);
        }
      };

      img.onerror = () => {
        console.error('❌ Error al cargar imagen sincronizada');
        URL.revokeObjectURL(url);
        if (callback) callback();
      };

      img.src = url;
    },
    'image/png',
    1.0
  );
}

// ========== FUNCIÓN PARA REGISTRAR OPERACIÓN EN BACKEND ==========
async function registrarOperacion(tipo, descripcion) {
  try {
    const userData = sessionStorage.getItem('artifyUser');
    const idSesion = sessionStorage.getItem('artifyIdSesion');

    if (!userData || !idSesion) return;

    const usuario = JSON.parse(userData);

    await fetchAuth(`${API}/api/operacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario: usuario.id,
        idSesion: parseInt(idSesion),
        tipo,
        descripcion,
      }),
    });

    console.log('✅ Operación registrada en MySQL:', tipo);
  } catch (err) {
    console.warn('⚠️ No se pudo registrar la operación:', err);
  }
}

// ========== FUNCIÓN PARA GUARDAR ESTADO EN HISTORIAL ==========
function guardarEstadoEnHistorial(descripcion) {
  // Si estamos en medio del historial, eliminar los estados futuros
  if (historyIndex < operationsHistory.length - 1) {
    operationsHistory = operationsHistory.slice(0, historyIndex + 1);
  }

  // Guardar el estado actual del canvas como imagen
  canvas.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob);
      operationsHistory.push({
        imageUrl: url,
        descripcion: descripcion,
        timestamp: Date.now(),
        width: canvas.width,
        height: canvas.height,
      });

      historyIndex++;

      // Limitar el historial a 20 operaciones para no consumir mucha memoria
      if (operationsHistory.length > 20) {
        const removed = operationsHistory.shift();
        URL.revokeObjectURL(removed.imageUrl);
        historyIndex--;
      }

      actualizarBotonesHistorial();
      actualizarContadorOperaciones();
    },
    'image/png',
    1.0
  );
}

function actualizarBotonesHistorial() {
  btnDeshacer.disabled = historyIndex <= 0;
  btnRehacer.disabled = historyIndex >= operationsHistory.length - 1;
}

function actualizarContadorOperaciones() {
  operationsCount.textContent = `${operationsHistory.length} operaciones`;
}

// ========== FUNCIONES DE RESOLUCIÓN ==========
function verificarResolucion() {
  const anchoVentana = document.documentElement.clientWidth;
  const altoVentana = document.documentElement.clientHeight;
  console.log(`🔍 Resolución detectada: ${anchoVentana} x ${altoVentana}px`);

  const noVolverAMostrarGuardado = sessionStorage.getItem(LOCAL_STORAGE_KEY);
  if (noVolverAMostrarGuardado === 'true') return;

  if (
    anchoVentana < RESOLUCION_MINIMA_ANCHO ||
    altoVentana < RESOLUCION_MINIMA_ALTO
  ) {
    mostrarModalResolucion(anchoVentana, altoVentana);
  }
}

function mostrarModalResolucion(ancho, alto) {
  const modal = document.getElementById('modalResolucion');
  const resolucionActual = document.getElementById('resolucionActual');
  if (!modal || !resolucionActual) return;

  resolucionActual.textContent = `${ancho} x ${alto}px`;
  modal.style.display = 'flex';
}

window.cerrarModalResolucion = function () {
  const modal = document.getElementById('modalResolucion');
  if (modal) modal.style.display = 'none';
};

window.noVolverAMostrar = function () {
  sessionStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  window.cerrarModalResolucion();
  if (typeof mostrarNotificacion === 'function') {
    mostrarNotificacion(
      'info',
      'Preferencia guardada. No volveremos a mostrar este mensaje.'
    );
  }
};

// ========== INICIALIZACIÓN ==========
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando Artify Editor...');
  verificarResolucion();

  // Cargar usuario e iniciar sesión de edición
  const usuarioData = sessionStorage.getItem('artifyUser');
  if (usuarioData) {
    try {
      const usuario = JSON.parse(usuarioData);
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = `${usuario.nombres} ${usuario.apellidos}`;
      }

      // Iniciar sesión de edición en el backend
      const res = await fetchAuth(`${API}/api/sesion/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idUsuario: usuario.id }),
      });

      const data = await res.json();
      if (data.mensaje === 'Sesión iniciada') {
        sessionStorage.setItem('artifyIdSesion', data.idSesion);
        console.log('✅ Sesión de edición iniciada. ID:', data.idSesion);
      }
    } catch (error) {
      console.warn('⚠️ Error al parsear datos del usuario');
    }
  }
  // Inicializar elementos del DOM
  canvas = document.getElementById('mainCanvas');
  if (canvas) ctx = canvas.getContext('2d', { willReadFrequently: true });

  fileInput = document.getElementById('fileInput');
  btnSubir = document.getElementById('btnSubir');
  btnDescargar = document.getElementById('btnDescargar');
  dropZone = document.getElementById('dropZone');
  canvasWrapper = document.getElementById('canvasWrapper');
  imageInfo = document.getElementById('imageInfo');

  btnRecortar = document.getElementById('btnRecortar');
  btnRedimensionar = document.getElementById('btnRedimensionar');
  btnRotar = document.getElementById('btnRotar');
  btnFiltros = document.getElementById('btnFiltros');
  submenuFiltros = document.getElementById('submenuFiltros');

  btnDeshacer = document.getElementById('btnDeshacer');
  btnRehacer = document.getElementById('btnRehacer');

  btnZoomIn = document.getElementById('btnZoomIn');
  btnZoomOut = document.getElementById('btnZoomOut');
  zoomLevelDisplay = document.getElementById('zoomLevel');

  operationsCount = document.getElementById('operationsCount');

  // ========== SUBIR IMAGEN ==========
  btnSubir.addEventListener('click', () => {
    // Resetear el valor del input para permitir cargar el mismo archivo
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) cargarImagen(file);
  });

  // ========== DRAG & DROP ==========
  dropZone.addEventListener('click', () => {
    // Resetear el valor del input para permitir cargar el mismo archivo
    fileInput.value = '';
    fileInput.click();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) cargarImagen(file);
  });

  // ========== FUNCIÓN CARGAR IMAGEN ==========
  function cargarImagen(file) {
    const tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposValidos.includes(file.type)) {
      mostrarNotificacion(
        'error',
        'Formato no válido. Solo JPG, PNG y WebP'
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      mostrarNotificacion('error', 'La imagen supera el límite de 10MB');
      return;
    }

    actualizarEstado('Cargando imagen...', 'processing');

    // Registrar imagen editada en MySQL
    const userData = sessionStorage.getItem('artifyUser');
    const idSesion = sessionStorage.getItem('artifyIdSesion');
    if (userData && idSesion) {
      const usuario = JSON.parse(userData);
      const formatoOriginal = file.type.replace('image/', '');
      fetchAuth(`${API}/api/imagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUsuario: usuario.id,
          idSesion: parseInt(idSesion),
          nombreOriginal: file.name,
          formatoOriginal: formatoOriginal,
          formatoFinal: formatoOriginal,
          tamanoOriginal: file.size,
        }),
      }).then(() => console.log('✅ Imagen registrada en MySQL:', file.name));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        currentImage = img;

        // Resetear formato y calidad al cargar nueva imagen
        formatoActual = null;
        calidadActual = null;

        mostrarCanvas();
        habilitarHerramientas();
        actualizarPropiedades(file, img);
        actualizarEstado('Listo', 'success');
        // Notificación removida

        // Limpiar historial anterior y guardar estado inicial
        operationsHistory.forEach((op) => URL.revokeObjectURL(op.imageUrl));
        operationsHistory = [];
        historyIndex = -1;
        guardarEstadoEnHistorial('Imagen cargada');
      };
      img.onerror = () => {
        mostrarNotificacion('error', 'Error al cargar la imagen');
        actualizarEstado('Error', 'error');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function mostrarCanvas() {
    dropZone.style.display = 'none';
    canvasWrapper.style.display = 'flex';
    imageInfo.style.display = 'block';
  }

  function habilitarHerramientas() {
    btnDescargar.disabled = false;
    btnRecortar.disabled = false;
    btnRedimensionar.disabled = false;
    btnRotar.disabled = false;
    btnFiltros.disabled = false;

    // Habilitar botón Convertir
    const btnConvertir = document.getElementById('btnConvertir');
    if (btnConvertir) {
      btnConvertir.disabled = false;
    }
  }

  function actualizarPropiedades(file, img) {
    const nombreElement = document.getElementById('propNombre');
    const tamanoElement = document.getElementById('propTamano');
    const dimensionesElement = document.getElementById('propDimensiones');
    const formatoElement = document.getElementById('propFormato');

    // Configurar el nombre con truncamiento
    if (nombreElement) {
      nombreElement.textContent = file.name;
      nombreElement.title = file.name; // Tooltip con nombre completo
      nombreElement.style.overflow = 'hidden';
      nombreElement.style.textOverflow = 'ellipsis';
      nombreElement.style.whiteSpace = 'nowrap';
      nombreElement.style.maxWidth = '100%';
      nombreElement.style.display = 'block';
    }

    if (tamanoElement) {
      tamanoElement.textContent = formatearTamano(file.size);
    }

    if (dimensionesElement) {
      dimensionesElement.textContent = `${img.width} x ${img.height} px`;
    }

    if (formatoElement) {
      formatoElement.textContent = file.type.split('/')[1].toUpperCase();
    }

    actualizarDimensionesDisplay();
  }

  function actualizarDimensionesDisplay() {
    document.getElementById('imageDimensions').textContent =
      `${canvas.width} x ${canvas.height} px`;
    document.getElementById('propDimensiones').textContent =
      `${canvas.width} x ${canvas.height} px`;
  }

  function formatearTamano(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  }

  // ========== DESCARGAR IMAGEN ==========
  btnDescargar.addEventListener('click', async () => {
    if (!currentImage) return;
    actualizarEstado('Generando descarga...', 'processing');

    // Obtener preferencias desde MySQL
    const prefs = await cargarPreferencias();

    // Si hay un formato convertido, usar ese; si no, usar las preferencias
    const formato = formatoActual || prefs.formatoDefecto || 'png';
    const calidad = calidadActual || prefs.calidadExportacion || 'alta';

    registrarOperacion('descargar', `Descarga en formato ${formato}`);

    // Mapear calidad a valor numérico
    const calidadMap = {
      alta: 1.0,
      media: 0.8,
      baja: 0.6,
    };

    const calidadNumero = calidadMap[calidad];

    // Mapeo de formatos (PNG, JPEG, WebP solamente)
    const mimeTypeMap = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };

    const mimeType = mimeTypeMap[formato] || 'image/png';
    const extension = formato === 'jpeg' ? 'jpg' : formato;

    canvas.toBlob(
      (blob) => {
        const tamanoKB = (blob.size / 1024).toFixed(2);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `artify-editado-${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);

        actualizarEstado('Listo', 'success');
        mostrarNotificacion(
          'success',
          `Imagen descargada en ${formato.toUpperCase()} - Calidad: ${calidad} (${tamanoKB} KB)`
        );
        guardarEstadoEnHistorial('Imagen descargada');
      },
      mimeType,
      calidadNumero
    );
  });

  // ========== CONVERTIR FORMATO ==========
  const btnConvertir = document.getElementById('btnConvertir');

  if (btnConvertir) {
    btnConvertir.addEventListener('click', () => {
      if (btnConvertir.disabled) return;

      ocultarTodosLosControles();
      const convertControls = document.getElementById('convertControls');
      if (convertControls) {
        convertControls.style.display = 'block';

        // Verificar si el formato actual es PNG para ocultar calidad
        actualizarVisibilidadCalidad();
      }

      marcarHerramientaActiva(btnConvertir);
    });
  }

  // Función para actualizar visibilidad del selector de calidad
  function actualizarVisibilidadCalidad() {
    const convertFormato = document.getElementById('convertFormato');
    const convertCalidadGroup = document.getElementById('convertCalidadGroup');

    if (!convertFormato || !convertCalidadGroup) return;

    if (convertFormato.value === 'png') {
      convertCalidadGroup.classList.add('hidden');
    } else {
      convertCalidadGroup.classList.remove('hidden');
    }
  }

  // Event listener para cambio de formato
  const convertFormato = document.getElementById('convertFormato');

  if (convertFormato) {
    convertFormato.addEventListener('change', () => {
      actualizarVisibilidadCalidad();
    });
  }

  // Event listener para el botón de aplicar conversión
  const btnAplicarConversion = document.getElementById('btnAplicarConversion');
  if (btnAplicarConversion) {
    btnAplicarConversion.addEventListener('click', () => {
      if (!currentImage) {
        mostrarNotificacion('error', 'No hay imagen cargada');
        return;
      }

      const formatoDestino = document.getElementById('convertFormato').value;
      const calidadConversion = document.getElementById('convertCalidad').value;

      console.log('🔄 Convirtiendo a:', formatoDestino);
      actualizarEstado('Convirtiendo imagen...', 'processing');
      registrarOperacion('convertir', `Conversión a formato ${formatoDestino}`);

      // Mapear calidad a valor numérico
      const calidadMap = {
        alta: 1.0,
        media: 0.8,
        baja: 0.6,
      };

      const calidadNumero = calidadMap[calidadConversion];

      // Mapeo de formatos (PNG, JPEG, WebP solamente)
      const mimeTypeMap = {
        png: 'image/png',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
      };

      const mimeType = mimeTypeMap[formatoDestino] || 'image/png';

      // Convertir el canvas al nuevo formato (SIN descargar)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            mostrarNotificacion('error', 'Error al convertir la imagen');
            actualizarEstado('Error', 'error');
            return;
          }

          // Calcular tamaño del archivo convertido
          const tamanoKB = (blob.size / 1024).toFixed(2);

          // Crear nueva imagen desde el blob convertido
          const url = URL.createObjectURL(blob);
          const img = new Image();

          img.onload = () => {
            URL.revokeObjectURL(url);

            // Actualizar currentImage con la versión convertida
            currentImage = img;

            // GUARDAR formato y calidad actuales para el botón Descargar
            formatoActual = formatoDestino;
            calidadActual = calidadConversion;

            // Redibujar en el canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(currentImage, 0, 0);

            // Actualizar información de propiedades
            const formatoElement = document.getElementById('propFormato');
            if (formatoElement) {
              formatoElement.textContent = formatoDestino.toUpperCase();
            }

            const tamanoElement = document.getElementById('propTamano');
            if (tamanoElement) {
              tamanoElement.textContent = tamanoKB + ' KB';
            }

            actualizarEstado('Listo', 'success');
            mostrarNotificacion(
              'success',
              `Imagen convertida a ${formatoDestino.toUpperCase()} (${tamanoKB} KB) - Calidad: ${calidadConversion}. Al descargar se guardará en este formato.`
            );
            guardarEstadoEnHistorial(
              `Conversión a ${formatoDestino.toUpperCase()}`
            );
          };

          img.onerror = () => {
            URL.revokeObjectURL(url);
            mostrarNotificacion('error', 'Error al procesar la conversión');
            actualizarEstado('Error', 'error');
          };

          img.src = url;
        },
        mimeType,
        calidadNumero
      );
    });
  }

  function autoguardarImagen() {
    const prefs = cargarPreferencias();

    if (!prefs.autoguardado || !currentImage) {
      return;
    }

    const formato = prefs.formatoDefecto || 'png';
    const calidad = prefs.calidadExportacion || 'alta';

    const calidadMap = {
      alta: 1.0,
      media: 0.8,
      baja: 0.6,
    };

    const calidadNumero = calidadMap[calidad];

    // Mapeo de formatos con soporte para WebP
    const mimeTypeMap = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };

    const mimeType = mimeTypeMap[formato] || 'image/png';

    // ✅ NO descargar automáticamente, solo guardar en localStorage como backup
    canvas.toBlob(
      (blob) => {
        // Guardar en memoria temporal como backup
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            // Guardar solo la imagen más reciente (no acumular)
            localStorage.setItem('artify_backup_image', reader.result);
            localStorage.setItem(
              'artify_backup_timestamp',
              Date.now().toString()
            );
            console.log('💾 Backup automático guardado');
          } catch (e) {
            console.warn('⚠️ No se pudo guardar backup (imagen muy grande)');
          }
        };
        reader.readAsDataURL(blob);
      },
      mimeType,
      calidadNumero
    );
  }

  // ========== FILTROS ==========
  btnFiltros.addEventListener('click', () => {
    if (btnFiltros.disabled) return;
    const isExpanded = submenuFiltros.style.display === 'flex';
    submenuFiltros.style.display = isExpanded ? 'none' : 'flex';
    btnFiltros.classList.toggle('expanded');
  });

  const filtrosButtons = document.querySelectorAll('.submenu-btn');
  filtrosButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      currentFilter = filter;
      mostrarControlesFiltro(filter);
      filtrosButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Event listener para actualizar el valor del slider de intensidad
  const filterIntensitySlider = document.getElementById('filterIntensity');
  const filterIntensityValue = document.getElementById('filterIntensityValue');

  if (filterIntensitySlider && filterIntensityValue) {
    filterIntensitySlider.addEventListener('input', (e) => {
      filterIntensityValue.textContent = e.target.value + '%';
    });
  }

  function mostrarControlesFiltro(filter) {
    ocultarTodosLosControles();
    const filterControls = document.getElementById('filterControls');
    if (filterControls) {
      filterControls.style.display = 'block';
    }
  }

  document.getElementById('btnAplicarFiltro').addEventListener('click', () => {
    if (!currentImage || !currentFilter) {
      mostrarNotificacion('error', 'Debes seleccionar un filtro primero');
      return;
    }

    console.log('🎨 Aplicando filtro:', currentFilter);
    actualizarEstado('Aplicando filtro...', 'processing');

    const intensity = document.getElementById('filterIntensity').value / 100;

    // Obtener datos del canvas actual
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (currentFilter) {
      case 'grayscale':
        aplicarBlancoYNegro(data, intensity);
        break;
      case 'sepia':
        aplicarSepia(data, intensity);
        break;
      case 'brightness':
        aplicarBrillo(data, intensity);
        break;
      case 'contrast':
        aplicarContraste(data, intensity);
        break;
    }

    ctx.putImageData(imageData, 0, 0);

    sincronizarImagenYCanvas(() => {
      // Notificación removida
      actualizarEstado('Listo', 'success');
      guardarEstadoEnHistorial(`Filtro: ${currentFilter}`);
      // Registrar filtro en MySQL
      const filtrosNombres = {
        grayscale: 'Blanco y Negro',
        sepia: 'Sepia',
        brightness: 'Brillo',
        contrast: 'Contraste',
      };
      registrarOperacion(
        'filtro',
        `Filtro aplicado: ${filtrosNombres[currentFilter] || currentFilter}`
      );
      // Resetear la selección del filtro para poder aplicar múltiples veces
      currentFilter = null;
      document
        .querySelectorAll('.submenu-btn')
        .forEach((b) => b.classList.remove('active'));
    });
  });

  function aplicarBlancoYNegro(data, intensity) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i] + (gray - data[i]) * intensity;
      data[i + 1] = data[i + 1] + (gray - data[i + 1]) * intensity;
      data[i + 2] = data[i + 2] + (gray - data[i + 2]) * intensity;
    }
  }

  function aplicarSepia(data, intensity) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const tr = 0.393 * r + 0.769 * g + 0.189 * b;
      const tg = 0.349 * r + 0.686 * g + 0.168 * b;
      const tb = 0.272 * r + 0.534 * g + 0.131 * b;
      data[i] = r + (tr - r) * intensity;
      data[i + 1] = g + (tg - g) * intensity;
      data[i + 2] = b + (tb - b) * intensity;
    }
  }

  function aplicarBrillo(data, intensity) {
    const adjustment = (intensity - 0.5) * 100;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + adjustment));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
    }
  }

  function aplicarContraste(data, intensity) {
    const factor =
      (259 * (intensity * 255 + 255)) / (255 * (259 - intensity * 255));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(
        255,
        Math.max(0, factor * (data[i + 1] - 128) + 128)
      );
      data[i + 2] = Math.min(
        255,
        Math.max(0, factor * (data[i + 2] - 128) + 128)
      );
    }
  }

  // ========== REDIMENSIONAR ==========
  btnRedimensionar.addEventListener('click', () => {
    if (btnRedimensionar.disabled) return;

    ocultarTodosLosControles();
    const resizeControls = document.getElementById('resizeControls');
    if (resizeControls) {
      resizeControls.style.display = 'block';
      document.getElementById('resizeWidth').value = canvas.width;
      document.getElementById('resizeHeight').value = canvas.height;
    }

    marcarHerramientaActiva(btnRedimensionar);
  });

  const resizeWidth = document.getElementById('resizeWidth');
  const resizeHeight = document.getElementById('resizeHeight');
  const mantenerProporcion = document.getElementById('mantenerProporcion');
  let aspectRatio = 1;

  resizeWidth.addEventListener('input', () => {
    if (mantenerProporcion.checked && canvas.width > 0) {
      aspectRatio = canvas.width / canvas.height;
      resizeHeight.value = Math.round(resizeWidth.value / aspectRatio);
    }
  });

  resizeHeight.addEventListener('input', () => {
    if (mantenerProporcion.checked && canvas.height > 0) {
      aspectRatio = canvas.width / canvas.height;
      resizeWidth.value = Math.round(resizeHeight.value * aspectRatio);
    }
  });

  document
    .getElementById('btnAplicarRedimension')
    .addEventListener('click', () => {
      if (!currentImage) {
        mostrarNotificacion('error', 'No hay imagen cargada');
        return;
      }

      const newWidth = parseInt(resizeWidth.value);
      const newHeight = parseInt(resizeHeight.value);

      if (
        newWidth < 1 ||
        newHeight < 1 ||
        isNaN(newWidth) ||
        isNaN(newHeight)
      ) {
        mostrarNotificacion('error', 'Las dimensiones deben ser mayores a 0');
        return;
      }

      console.log('📏 Redimensionando:', newWidth, 'x', newHeight);
      actualizarEstado('Redimensionando...', 'processing');
      registrarOperacion(
        'redimensionar',
        `Redimensionado a ${newWidth}x${newHeight}px`
      );

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;

      tempCtx.drawImage(currentImage, 0, 0, newWidth, newHeight);

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);

      sincronizarImagenYCanvas(() => {
        actualizarDimensionesDisplay();
        // Notificación removida
        actualizarEstado('Listo', 'success');
        guardarEstadoEnHistorial(`Redimensionar: ${newWidth}x${newHeight}`);
      });
    });

  // ========== ROTAR ==========
  btnRotar.addEventListener('click', () => {
    if (btnRotar.disabled) return;

    ocultarTodosLosControles();
    const rotateControls = document.getElementById('rotateControls');
    if (rotateControls) {
      rotateControls.style.display = 'block';
    }

    marcarHerramientaActiva(btnRotar);
  });

  const rotateButtons = document.querySelectorAll('.btn-rotate');
  rotateButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const angle = parseInt(btn.dataset.angle);
      rotarImagen(angle);
    });
  });

  function rotarImagen(angle) {
    if (!currentImage) {
      mostrarNotificacion('error', 'No hay imagen cargada');
      return;
    }

    console.log('🔄 Rotando imagen:', angle, '°');
    actualizarEstado('Rotando imagen...', 'processing');
    registrarOperacion('rotar', `Rotación de ${angle}°`);

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const imgWidth = currentImage.width;
    const imgHeight = currentImage.height;

    if (angle === 90 || angle === 270) {
      tempCanvas.width = imgHeight;
      tempCanvas.height = imgWidth;
    } else {
      tempCanvas.width = imgWidth;
      tempCanvas.height = imgHeight;
    }

    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((angle * Math.PI) / 180);
    tempCtx.drawImage(
      currentImage,
      -imgWidth / 2,
      -imgHeight / 2,
      imgWidth,
      imgHeight
    );

    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);

    sincronizarImagenYCanvas(() => {
      actualizarDimensionesDisplay();
      // Notificación removida
      actualizarEstado('Listo', 'success');
      guardarEstadoEnHistorial(`Rotar: ${angle}°`);
    });
  }

  // ========== RECORTAR ==========
  btnRecortar.addEventListener('click', () => {
    if (btnRecortar.disabled) return;

    ocultarTodosLosControles();
    const cropControls = document.getElementById('cropControls');
    if (cropControls) {
      cropControls.style.display = 'block';
    }

    marcarHerramientaActiva(btnRecortar);
    activarModoRecorte();
  });

  function activarModoRecorte() {
    if (!currentImage) {
      mostrarNotificacion('error', 'No hay imagen cargada');
      return;
    }

    console.log('✂️ Activando modo recorte');
    cropMode = true;
    canvas.style.cursor = 'crosshair';
    canvas.addEventListener('pointerdown', iniciarRecorte);
    canvas.addEventListener('pointermove', dibujarRecorte);
    canvas.addEventListener('pointerup', finalizarRecorte);

    // Event listener para cambio de proporción
    const cropRatioSelect = document.getElementById('cropRatio');
    if (cropRatioSelect) {
      cropRatioSelect.addEventListener('change', (e) => {
        cropRatio = e.target.value;
        console.log('📐 Proporción seleccionada:', cropRatio);
      });
    }
  }

  // ========== FUNCIONES DE RECORTE CORREGIDAS ==========

  function iniciarRecorte(e) {
    if (!cropMode) return;
    isDragging = true;

    const rect = canvas.getBoundingClientRect();

    // Calcular escala considerando el zoom actual
    const currentScale = zoomLevel / 100;
    const scaleX = canvas.width / (rect.width / currentScale);
    const scaleY = canvas.height / (rect.height / currentScale);

    // Ajustar coordenadas del mouse
    startX = (e.clientX - rect.left) * scaleX;
    startY = (e.clientY - rect.top) * scaleY;

    console.log('🎯 Inicio recorte:', {
      startX,
      startY,
      scaleX,
      scaleY,
      zoom: zoomLevel,
    });
  }

  function dibujarRecorte(e) {
    if (!isDragging || !cropMode) return;

    const rect = canvas.getBoundingClientRect();

    // Calcular escala considerando el zoom actual
    const currentScale = zoomLevel / 100;
    const scaleX = canvas.width / (rect.width / currentScale);
    const scaleY = canvas.height / (rect.height / currentScale);

    // Calcular posición actual del mouse
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    // Calcular dimensiones base
    let width = Math.abs(currentX - startX);
    let height = Math.abs(currentY - startY);

    // Aplicar restricción de proporción ANTES de asignar a cropArea
    if (cropRatio !== 'free' && width > 0 && height > 0) {
      const ratios = {
        '1:1': 1,
        '16:9': 16 / 9,
        '4:3': 4 / 3,
        '3:2': 3 / 2,
      };

      const targetRatio = ratios[cropRatio];
      if (targetRatio) {
        const currentRatio = width / height;

        // Ajustar dimensiones para mantener la proporción
        if (currentRatio > targetRatio) {
          // Ancho es demasiado grande, ajustar basándose en altura
          width = height * targetRatio;
        } else {
          // Alto es demasiado grande, ajustar basándose en ancho
          height = width / targetRatio;
        }
      }
    }

    // Calcular posición (respetando la dirección del arrastre)
    let x = currentX < startX ? currentX : startX;
    let y = currentY < startY ? currentY : startY;

    // Verificar límites del canvas
    if (x + width > canvas.width) {
      width = canvas.width - x;
      if (cropRatio !== 'free') {
        const ratios = {
          '1:1': 1,
          '16:9': 16 / 9,
          '4:3': 4 / 3,
          '3:2': 3 / 2,
        };
        const targetRatio = ratios[cropRatio];
        if (targetRatio) {
          height = width / targetRatio;
        }
      }
    }

    if (y + height > canvas.height) {
      height = canvas.height - y;
      if (cropRatio !== 'free') {
        const ratios = {
          '1:1': 1,
          '16:9': 16 / 9,
          '4:3': 4 / 3,
          '3:2': 3 / 2,
        };
        const targetRatio = ratios[cropRatio];
        if (targetRatio) {
          width = height * targetRatio;
        }
      }
    }

    // Prevenir valores negativos
    if (x < 0) x = 0;
    if (y < 0) y = 0;

    // Asignar valores finales a cropArea
    cropArea.x = x;
    cropArea.y = y;
    cropArea.width = width;
    cropArea.height = height;

    redibujarConRecorte();
  }

  function finalizarRecorte() {
    isDragging = false;
    console.log('✅ Recorte finalizado:', cropArea);
  }

  function redibujarConRecorte() {
    if (!currentImage) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0);

    // Oscurecer área fuera del recorte
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Limpiar área de recorte
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.drawImage(
      currentImage,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height
    );

    // ===== BORDE PRINCIPAL CON LÍNEAS PUNTEADAS =====
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]); // Línea punteada: 10px línea, 5px espacio
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // ===== GUÍAS DE TERCIOS (regla de los tercios) =====
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Líneas más sutiles

    // Líneas verticales (dividir en 3 partes horizontalmente)
    const tercioAncho = cropArea.width / 3;

    // Primera línea vertical
    ctx.beginPath();
    ctx.moveTo(cropArea.x + tercioAncho, cropArea.y);
    ctx.lineTo(cropArea.x + tercioAncho, cropArea.y + cropArea.height);
    ctx.stroke();

    // Segunda línea vertical
    ctx.beginPath();
    ctx.moveTo(cropArea.x + tercioAncho * 2, cropArea.y);
    ctx.lineTo(cropArea.x + tercioAncho * 2, cropArea.y + cropArea.height);
    ctx.stroke();

    // Líneas horizontales (dividir en 3 partes verticalmente)
    const tercioAlto = cropArea.height / 3;

    // Primera línea horizontal
    ctx.beginPath();
    ctx.moveTo(cropArea.x, cropArea.y + tercioAlto);
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + tercioAlto);
    ctx.stroke();

    // Segunda línea horizontal
    ctx.beginPath();
    ctx.moveTo(cropArea.x, cropArea.y + tercioAlto * 2);
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + tercioAlto * 2);
    ctx.stroke();

    // ===== ESQUINAS DECORATIVAS (opcional pero profesional) =====
    ctx.strokeStyle = '#28FFCE'; // Color cyan de tu tema
    ctx.lineWidth = 3;
    ctx.setLineDash([]); // Líneas sólidas para las esquinas

    const esquinaSize = 20; // Tamaño de las esquinas

    // Esquina superior izquierda
    ctx.beginPath();
    ctx.moveTo(cropArea.x, cropArea.y + esquinaSize);
    ctx.lineTo(cropArea.x, cropArea.y);
    ctx.lineTo(cropArea.x + esquinaSize, cropArea.y);
    ctx.stroke();

    // Esquina superior derecha
    ctx.beginPath();
    ctx.moveTo(cropArea.x + cropArea.width - esquinaSize, cropArea.y);
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y);
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + esquinaSize);
    ctx.stroke();

    // Esquina inferior izquierda
    ctx.beginPath();
    ctx.moveTo(cropArea.x, cropArea.y + cropArea.height - esquinaSize);
    ctx.lineTo(cropArea.x, cropArea.y + cropArea.height);
    ctx.lineTo(cropArea.x + esquinaSize, cropArea.y + cropArea.height);
    ctx.stroke();

    // Esquina inferior derecha
    ctx.beginPath();
    ctx.moveTo(
      cropArea.x + cropArea.width - esquinaSize,
      cropArea.y + cropArea.height
    );
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + cropArea.height);
    ctx.lineTo(
      cropArea.x + cropArea.width,
      cropArea.y + cropArea.height - esquinaSize
    );
    ctx.stroke();

    // Resetear líneas al estado normal
    ctx.setLineDash([]);
  }

  document.getElementById('btnAplicarRecorte').addEventListener('click', () => {
    if (!currentImage || cropArea.width === 0 || cropArea.height === 0) {
      mostrarNotificacion('error', 'Debes seleccionar un área para recortar');
      return;
    }

    console.log('✂️ Aplicando recorte:', cropArea);
    actualizarEstado('Recortando imagen...', 'processing');
    registrarOperacion('recorte', 'Recorte de imagen aplicado');

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const cropW = Math.floor(cropArea.width);
    const cropH = Math.floor(cropArea.height);
    const cropX = Math.floor(cropArea.x);
    const cropY = Math.floor(cropArea.y);

    tempCanvas.width = cropW;
    tempCanvas.height = cropH;

    tempCtx.drawImage(
      currentImage,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );

    desactivarModoRecorte();

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);

    cropArea = { x: 0, y: 0, width: 0, height: 0 };

    sincronizarImagenYCanvas(() => {
      actualizarDimensionesDisplay();
      // Notificación removida
      actualizarEstado('Listo', 'success');
      guardarEstadoEnHistorial('Recortar imagen');
    });
  });

  function desactivarModoRecorte() {
    if (!cropMode) return;

    console.log('✅ Desactivando modo recorte');
    cropMode = false;
    canvas.style.cursor = 'default';

    canvas.removeEventListener('pointerdown', iniciarRecorte);
    canvas.removeEventListener('pointermove', dibujarRecorte);
    canvas.removeEventListener('pointerup', finalizarRecorte);

    if (currentImage) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(currentImage, 0, 0);
    }
  }

  // ========== ZOOM ==========
  btnZoomIn.addEventListener('click', () => {
    if (zoomLevel < 200) {
      zoomLevel += 10;
      aplicarZoom();
    }
  });

  btnZoomOut.addEventListener('click', () => {
    if (zoomLevel > 50) {
      zoomLevel -= 10;
      aplicarZoom();
    }
  });

  function aplicarZoom() {
    canvas.style.transform = `scale(${zoomLevel / 100})`;
    zoomLevelDisplay.textContent = `${zoomLevel}%`;
  }

  // ========== HISTORIAL (DESHACER/REHACER) ==========
  btnDeshacer.addEventListener('click', () => {
    if (historyIndex <= 0) return;

    historyIndex--;
    const estado = operationsHistory[historyIndex];

    actualizarEstado('Deshaciendo...', 'processing');

    const img = new Image();
    img.onload = () => {
      canvas.width = estado.width;
      canvas.height = estado.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      currentImage = img;

      actualizarDimensionesDisplay();
      actualizarBotonesHistorial();
      // Notificación removida
      actualizarEstado('Listo', 'success');
    };
    img.src = estado.imageUrl;
  });

  btnRehacer.addEventListener('click', () => {
    if (historyIndex >= operationsHistory.length - 1) return;

    historyIndex++;
    const estado = operationsHistory[historyIndex];

    actualizarEstado('Rehaciendo...', 'processing');

    const img = new Image();
    img.onload = () => {
      canvas.width = estado.width;
      canvas.height = estado.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      currentImage = img;

      actualizarDimensionesDisplay();
      actualizarBotonesHistorial();
      // Notificación removida
      actualizarEstado('Listo', 'success');
    };
    img.src = estado.imageUrl;
  });

  // ========== ATAJOS DE TECLADO ==========
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      btnDeshacer.click();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      btnRehacer.click();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (!btnDescargar.disabled) btnDescargar.click();
    }
  });

  // ========== UTILIDADES ==========
  function ocultarTodosLosControles() {
    const cropControls = document.getElementById('cropControls');
    const resizeControls = document.getElementById('resizeControls');
    const rotateControls = document.getElementById('rotateControls');
    const filterControls = document.getElementById('filterControls');
    const convertControls = document.getElementById('convertControls');

    if (cropControls) cropControls.style.display = 'none';
    if (resizeControls) resizeControls.style.display = 'none';
    if (rotateControls) rotateControls.style.display = 'none';
    if (filterControls) filterControls.style.display = 'none';
    if (convertControls) convertControls.style.display = 'none';
  }

  function marcarHerramientaActiva(boton) {
    document
      .querySelectorAll('.tool-btn')
      .forEach((btn) => btn.classList.remove('active'));
    boton.classList.add('active');
  }

  function actualizarEstado(texto, tipo = 'success') {
    // Solo registrar en consola para debugging
    const iconos = {
      processing: '⏳',
      success: '✅',
      error: '❌',
    };
    console.log(`${iconos[tipo] || '📌'} Estado: ${texto}`);
  }

  // ========== NOTIFICACIONES ==========
  function mostrarNotificacion(tipo, mensaje) {
    // Buscar el contenedor de notificaciones en la barra de estado
    let container = document.getElementById('statusNotifications');

    if (!container) {
      // Crear el contenedor si no existe
      container = document.createElement('div');
      container.id = 'statusNotifications';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.gap = '10px';
      container.style.position = 'absolute';
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.flex = '1';
      container.style.justifyContent = 'center';
      container.style.maxWidth = '600px';

      // Insertarlo en la barra de estado
      const statusBar = document.querySelector('.status-bar');
      statusBar.appendChild(container);
    }

    // Limpiar notificaciones anteriores
    container.innerHTML = '';

    const iconos = { error: '❌', warning: '⚠️', success: '✔', info: 'ℹ️' };

    // Crear notificación inline más compacta
    const notificacion = document.createElement('div');
    notificacion.style.display = 'flex';
    notificacion.style.alignItems = 'center';
    notificacion.style.gap = '10px';
    notificacion.style.padding = '8px 16px';
    notificacion.style.background =
      tipo === 'error'
        ? 'rgba(239, 68, 68, 0.15)'
        : tipo === 'warning'
          ? 'rgba(245, 158, 11, 0.15)'
          : tipo === 'info'
            ? 'rgba(0, 123, 255, 0.15)'
            : 'rgba(16, 185, 129, 0.15)';
    notificacion.style.border = `1px solid ${
      tipo === 'error'
        ? '#ef4444'
        : tipo === 'warning'
          ? '#f59e0b'
          : tipo === 'info'
            ? '#007bff'
            : '#10b981'
    }`;
    notificacion.style.borderRadius = '6px';
    notificacion.style.color = '#f5f5f5';
    notificacion.style.fontSize = '0.9rem';
    notificacion.style.fontFamily = "'Inconsolata', sans-serif";
    notificacion.style.animation = 'fadeIn 0.3s ease';
    notificacion.style.maxWidth = '100%';

    notificacion.innerHTML = `
      <span style="font-size: 1.2rem; line-height: 1;">${iconos[tipo]}</span>
      <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${mensaje}</span>
      <button style="background: transparent; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 1.1rem; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 3px; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='#fff'" onmouseout="this.style.background='transparent'; this.style.color='rgba(255,255,255,0.7)'">✕</button>
    `;

    container.appendChild(notificacion);

    // Botón cerrar
    const btnCerrar = notificacion.querySelector('button');
    btnCerrar.addEventListener('click', () => {
      notificacion.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        container.innerHTML = '';
      }, 300);
    });

    // Auto-cerrar según tipo
    const duracion =
      tipo === 'error' || tipo === 'warning'
        ? 5000
        : tipo === 'info'
          ? 3500
          : 5000;

    setTimeout(() => {
      if (notificacion.parentElement) {
        notificacion.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          container.innerHTML = '';
        }, 300);
      }
    }, duracion);

    // Agregar estilos de animación si no existen
    if (!document.getElementById('notificationStyles')) {
      const style = document.createElement('style');
      style.id = 'notificationStyles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(10px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  inicializarRF10yRF11();
  console.log('✅ Editor Artify cargado correctamente');

  // ========== CERRAR SESIÓN AL CERRAR EL NAVEGADOR ==========
  window.addEventListener('beforeunload', () => {
    const idSesion = sessionStorage.getItem('artifyIdSesion');
    if (idSesion) {
      // Usar sendBeacon para garantizar que la petición se envíe
      // incluso cuando el navegador se está cerrando
      fetch(`${API}/api/sesion/cerrar`, {
        method: 'POST',
        headers: construirHeadersAuth({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ idSesion: parseInt(idSesion) }),
        keepalive: true,
      });
      console.log('✅ Sesión cerrada al salir del navegador');
    }
  });
});

// ========== RESIZE LISTENER ==========
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(verificarResolucion, 500);
});

// ========== RF-10 Y RF-11 ==========
const PREFERENCIAS_KEY = 'artify_preferencias';
const PREFERENCIAS_DEFAULT = {
  notificacionesHabilitadas: true,
  calidadExportacion: 'alta',
  formatoDefecto: 'png',
  autoguardado: false,
};

async function cargarPreferencias() {
  try {
    const userData = sessionStorage.getItem('artifyUser');
    if (!userData) return { ...PREFERENCIAS_DEFAULT };

    const usuario = JSON.parse(userData);
    const res = await fetchAuth(`${API}/api/configuracion/${usuario.id}`);
    const data = await res.json();

    if (data.mensaje === 'ok') {
      console.log('✅ Preferencias cargadas desde MySQL');
      return data.configuracion;
    }
    return { ...PREFERENCIAS_DEFAULT };
  } catch {
    console.warn(
      '⚠️ No se pudo cargar configuración del servidor, usando valores por defecto'
    );
    return { ...PREFERENCIAS_DEFAULT };
  }
}

async function guardarPreferencias(prefs) {
  try {
    const userData = sessionStorage.getItem('artifyUser');
    if (!userData) return false;

    const usuario = JSON.parse(userData);

    const res = await fetchAuth(`${API}/api/configuracion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idUsuario: usuario.id,
        calidadExportacion: prefs.calidadExportacion,
        notificaciones: prefs.notificacionesHabilitadas,
        formatoDefecto: prefs.formatoDefecto,
        autoguardado: prefs.autoguardado,
      }),
    });

    const data = await res.json();
    console.log('✅ Preferencias guardadas en MySQL:', data.mensaje);
    return true;
  } catch {
    console.warn('⚠️ No se pudo guardar configuración en el servidor');
    return false;
  }
}

function aplicarPreferencias(prefs) {
  console.log('✅ Preferencias aplicadas:', prefs);
  console.log('📊 Calidad de exportación:', prefs.calidadExportacion);
  console.log('📄 Formato por defecto:', prefs.formatoDefecto);
  console.log(
    '💾 Autoguardado:',
    prefs.autoguardado ? 'Activado' : 'Desactivado'
  );
}

async function abrirModalConfiguracion() {
  const modal = document.getElementById('modalConfiguracion');
  if (!modal) return;

  const userData = sessionStorage.getItem('artifyUser');

  if (userData) {
    try {
      const usuario = JSON.parse(userData);
      const nombre = document.getElementById('configUserNombre');
      const email = document.getElementById('configUserEmail');
      const sesion = document.getElementById('configUserUltimaSesion');

      if (nombre)
        nombre.textContent = `${usuario.nombres} ${usuario.apellidos}`;
      if (email) email.textContent = usuario.correo;
      if (sesion)
        sesion.textContent = new Date().toLocaleString('es-CO', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
    } catch {}
  }

  // Cargar preferencias desde MySQL
  const prefs = await cargarPreferencias();

  const notif = document.getElementById('configNotificaciones');
  const calidad = document.getElementById('configCalidadExportacion');
  const formato = document.getElementById('configFormatoDefecto');
  const auto = document.getElementById('configAutoguardado');

  if (notif) notif.checked = prefs.notificacionesHabilitadas;
  if (calidad) calidad.value = prefs.calidadExportacion;
  if (formato) formato.value = prefs.formatoDefecto;
  if (auto) auto.checked = prefs.autoguardado;

  modal.style.display = 'flex';
}

function cerrarModalConfiguracion() {
  const modal = document.getElementById('modalConfiguracion');
  if (modal) modal.style.display = 'none';
}

async function guardarConfiguracion() {
  const notif = document.getElementById('configNotificaciones');
  const calidad = document.getElementById('configCalidadExportacion');
  const formato = document.getElementById('configFormatoDefecto');
  const auto = document.getElementById('configAutoguardado');

  const nuevas = {
    notificacionesHabilitadas: notif ? notif.checked : true,
    calidadExportacion: calidad ? calidad.value : 'alta',
    formatoDefecto: formato ? formato.value : 'png',
    autoguardado: auto ? auto.checked : false,
  };

  const guardado = await guardarPreferencias(nuevas);
  if (guardado) {
    aplicarPreferencias(nuevas);
    cerrarModalConfiguracion();
    mostrarNotificacion('success', 'Configuración guardada correctamente');
  }
}

async function abrirModalPerfil() {
  const modal = document.getElementById('modalPerfil');
  if (!modal) return;

  const userData = sessionStorage.getItem('artifyUser');
  if (userData) {
    try {
      const usuario = JSON.parse(userData);
      const nombre = document.getElementById('perfilNombre');
      const email = document.getElementById('perfilEmail');

      if (nombre)
        nombre.textContent = `${usuario.nombres} ${usuario.apellidos}`;
      if (email) email.textContent = usuario.correo;

      // Cargar estadísticas desde el backend
      const res = await fetchAuth(`${API}/api/estadisticas/${usuario.id}`);
      const data = await res.json();

      if (data.mensaje === 'ok') {
        const sesiones = document.getElementById('perfilSesiones');
        const operaciones = document.getElementById('perfilOperaciones');
        const imagenesEditadas = document.getElementById(
          'perfilImagenesEditadas'
        );

        if (sesiones) sesiones.textContent = data.estadisticas.sesiones;
        if (operaciones)
          operaciones.textContent = data.estadisticas.operaciones;
        if (imagenesEditadas)
          imagenesEditadas.textContent = data.estadisticas.imagenesEditadas;
      }
    } catch {}
  }

  modal.style.display = 'flex';
}

function cerrarModalPerfil() {
  const modal = document.getElementById('modalPerfil');
  if (modal) modal.style.display = 'none';
}

function mostrarConfirmacionLogout() {
  const modal = document.getElementById('modalConfirmarLogout');
  if (modal) modal.style.display = 'flex';
}

function cerrarConfirmacionLogout() {
  const modal = document.getElementById('modalConfirmarLogout');
  if (modal) modal.style.display = 'none';
}

async function cerrarSesionSegura() {
  const idSesion = sessionStorage.getItem('artifyIdSesion');

  if (idSesion) {
    try {
      await fetchAuth(`${API}/api/sesion/cerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idSesion: parseInt(idSesion) }),
      });
      console.log('✅ Sesión de edición cerrada correctamente');
    } catch (err) {
      console.warn('⚠️ No se pudo cerrar la sesión en el servidor');
    }
  }

  limpiarSesionAuth();
  setTimeout(() => (window.location.href = '../index.html'), 1000);
}

async function inicializarRF10yRF11() {
  const prefs = await cargarPreferencias();
  aplicarPreferencias(prefs);

  const btnConfig = document.getElementById('btnConfig');
  const btnCerrarConfig = document.getElementById('btnCerrarConfig');
  const btnCancelarConfig = document.getElementById('btnCancelarConfig');
  const btnGuardarConfig = document.getElementById('btnGuardarConfig');

  if (btnConfig) btnConfig.addEventListener('click', abrirModalConfiguracion);
  if (btnCerrarConfig)
    btnCerrarConfig.addEventListener('click', cerrarModalConfiguracion);
  if (btnCancelarConfig)
    btnCancelarConfig.addEventListener('click', cerrarModalConfiguracion);
  if (btnGuardarConfig)
    btnGuardarConfig.addEventListener('click', guardarConfiguracion);

  const modalConfig = document.getElementById('modalConfiguracion');
  if (modalConfig) {
    modalConfig.addEventListener('click', (e) => {
      if (e.target === modalConfig) cerrarModalConfiguracion();
    });
  }

  const btnPerfil = document.getElementById('btnPerfil');
  const btnCerrarPerfil = document.getElementById('btnCerrarPerfil');
  const btnAbrirConfigDesdePerfil = document.getElementById(
    'btnAbrirConfigDesdePerfil'
  );
  const btnCerrarSesion = document.getElementById('btnCerrarSesion');

  if (btnPerfil) btnPerfil.addEventListener('click', abrirModalPerfil);
  if (btnCerrarPerfil)
    btnCerrarPerfil.addEventListener('click', cerrarModalPerfil);
  if (btnAbrirConfigDesdePerfil) {
    btnAbrirConfigDesdePerfil.addEventListener('click', () => {
      cerrarModalPerfil();
      abrirModalConfiguracion();
    });
  }
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', () => {
      cerrarModalPerfil();
      mostrarConfirmacionLogout();
    });
  }

  const modalPerfil = document.getElementById('modalPerfil');
  if (modalPerfil) {
    modalPerfil.addEventListener('click', (e) => {
      if (e.target === modalPerfil) cerrarModalPerfil();
    });
  }

  const btnCancelarLogout = document.getElementById('btnCancelarLogout');
  const btnConfirmarLogout = document.getElementById('btnConfirmarLogout');

  if (btnCancelarLogout)
    btnCancelarLogout.addEventListener('click', cerrarConfirmacionLogout);
  if (btnConfirmarLogout)
    btnConfirmarLogout.addEventListener('click', cerrarSesionSegura);

  const modalConfirmarLogout = document.getElementById('modalConfirmarLogout');
  if (modalConfirmarLogout) {
    modalConfirmarLogout.addEventListener('click', (e) => {
      if (e.target === modalConfirmarLogout) cerrarConfirmacionLogout();
    });
  }
}
