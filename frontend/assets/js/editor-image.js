window.ArtifyEditorImage = (() => {
  const TIPOS_IMAGEN_VALIDOS = ['image/jpeg', 'image/png', 'image/webp'];
  const TAMANO_MAXIMO_ARCHIVO = 10 * 1024 * 1024;
  const MAXIMO_PIXELES_IMAGEN = 16_000_000;
  const MAXIMA_DIMENSION_IMAGEN = 8192;

  function validarArchivoImagen(file) {
    if (!file || !TIPOS_IMAGEN_VALIDOS.includes(file.type)) {
      return {
        valido: false,
        mensaje: 'Formato no válido. Solo JPG, PNG y WebP',
      };
    }

    if (!Number.isFinite(file.size) || file.size <= 0) {
      return { valido: false, mensaje: 'El archivo de imagen está vacío' };
    }

    if (file.size > TAMANO_MAXIMO_ARCHIVO) {
      return {
        valido: false,
        mensaje: 'La imagen supera el límite de 10 MB',
      };
    }

    return { valido: true };
  }

  function validarDimensionesImagen(ancho, alto) {
    if (
      !Number.isSafeInteger(ancho) ||
      !Number.isSafeInteger(alto) ||
      ancho <= 0 ||
      alto <= 0
    ) {
      return { valido: false, mensaje: 'Las dimensiones no son válidas' };
    }

    const totalPixeles = ancho * alto;
    if (
      ancho > MAXIMA_DIMENSION_IMAGEN ||
      alto > MAXIMA_DIMENSION_IMAGEN ||
      totalPixeles > MAXIMO_PIXELES_IMAGEN
    ) {
      const megapixeles = (totalPixeles / 1_000_000).toFixed(1);
      return {
        valido: false,
        mensaje: `Imagen demasiado grande: ${ancho} × ${alto} px (${megapixeles} MP). Máximo: 16 MP y 8192 px por lado.`,
      };
    }

    return { valido: true };
  }

  function normalizarFormatoImagen(tipoMime) {
    return String(tipoMime || '')
      .replace('image/', '')
      .replace('jpg', 'jpeg');
  }

  return {
    normalizarFormatoImagen,
    validarArchivoImagen,
    validarDimensionesImagen,
  };
})();
