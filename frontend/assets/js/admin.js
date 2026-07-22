// ========== CONFIGURACIÓN ==========
let usuarioIdEliminar = null;
let modoEdicion = false;
let todosLosUsuarios = [];
const modalAccesible = window.ArtifyModal || {
  abrir(modal) {
    if (modal) modal.style.display = 'flex';
  },
  cerrar(modal) {
    if (modal) modal.style.display = 'none';
  },
  registrar() {},
};

// ========== UTILIDADES ==========
function mostrarNotificacion(tipo, mensaje) {
  const notif = document.getElementById('adminNotificacion');
  notif.textContent = mensaje;
  notif.className = `admin-notificacion ${tipo} show`;
  setTimeout(() => notif.classList.remove('show'), 3000);
}

function mostrarError(id, mensaje) {
  const el = document.getElementById(`${id}-error`);
  const input = document.getElementById(id);
  if (el) {
    el.textContent = mensaje;
    el.classList.add('show');
  }
  if (input) input.classList.add('error');
}

function limpiarErrores() {
  document.querySelectorAll('.error-message').forEach((el) => {
    el.classList.remove('show');
  });
  document.querySelectorAll('input.error').forEach((el) => {
    el.classList.remove('error');
  });
}

function redirigirAccesoNoAutorizado() {
  const usuario = obtenerUsuarioAuth();
  const token = obtenerTokenAuth();

  if (usuario?.rol === 'usuario' && token) {
    window.location.href = './editor.html';
    return;
  }

  limpiarSesionAuth();
  window.location.href = './login.html';
}

function obtenerUsuarioAdminActual() {
  const usuario = obtenerUsuarioAuth();
  const token = obtenerTokenAuth();

  return usuario?.rol === 'admin' && token ? usuario : null;
}

function esAdministradorActual(idUsuario) {
  const administrador = obtenerUsuarioAdminActual();
  const idAdministrador = Number(administrador?.id);

  return (
    Number.isSafeInteger(idAdministrador) &&
    idAdministrador > 0 &&
    idAdministrador === Number(idUsuario)
  );
}

function esPasswordNuevaValida(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function esCedulaValida(cedula) {
  return typeof cedula === 'string' && /^[0-9]{6,20}$/.test(cedula);
}

function esFechaNacimientoValida(fechaNacimiento) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
    return false;
  }

  const fecha = new Date(`${fechaNacimiento}T00:00:00.000Z`);
  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === fechaNacimiento &&
    fecha <= new Date()
  );
}

function cumpleEdadMinima(fechaNacimiento, edadMinima = 18) {
  if (!esFechaNacimientoValida(fechaNacimiento)) {
    return false;
  }

  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  const diferenciaMes = hoy.getMonth() + 1 - mes;

  if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < dia)) {
    edad -= 1;
  }

  return edad >= edadMinima;
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const coincidencia = String(fechaStr).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!coincidencia) return '—';

  const [, ano, mes, dia] = coincidencia;
  return `${dia}/${mes}/${ano}`;
}

function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ========== CERRAR SESIÓN ==========
document.getElementById('btnLogout').addEventListener('click', async () => {
  limpiarSesionAuth();
  window.location.href = '../index.html';
});

// ========== SELECT — CARGAR USUARIOS ==========
async function cargarUsuarios() {
  try {
    const res = await fetchAuth(`${API}/api/admin/usuarios`);
    const data = await res.json();

    if (data.mensaje === 'ok') {
      todosLosUsuarios = data.usuarios;
      renderizarTabla(todosLosUsuarios);
      actualizarEstadisticas(todosLosUsuarios);
    } else if (res.status === 401 || res.status === 403) {
      redirigirAccesoNoAutorizado();
    }
  } catch (err) {
    console.error('❌ Error al cargar usuarios:', err);
    mostrarNotificacion('error', 'Error al cargar los usuarios');
  }
}

function renderizarTabla(usuarios) {
  const tbody = document.getElementById('tablaBody');
  const badge = document.getElementById('totalUsuariosBadge');
  badge.textContent = usuarios.length;

  if (usuarios.length === 0) {
    tbody.innerHTML = `
      <tr class="loading-row">
        <td colspan="10">No se encontraron usuarios</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = usuarios
    .map(
      (u) => {
        const idUsuario = Number(u.usr_id_usuario);
        const estado = escaparHtml(u.usr_estado_usuario);
        const estadoTexto = estado.charAt(0).toUpperCase() + estado.slice(1);
        const rolEsAdmin = u.usr_rol === 'admin';
        const esCuentaActual = esAdministradorActual(idUsuario);
        const botonEliminar = esCuentaActual
          ? `
          <button
            type="button"
            class="btn-eliminar-row"
            disabled
            title="No puedes eliminar tu propia cuenta administrativa"
          >
            Cuenta actual
          </button>`
          : `
          <button class="btn-eliminar-row" onclick="abrirEliminar(${idUsuario})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
            Eliminar
          </button>`;

        return `
    <tr>
      <td>${idUsuario}</td>
      <td>${escaparHtml(u.usr_nombres)}</td>
      <td>${escaparHtml(u.usr_apellidos)}</td>
      <td>${escaparHtml(u.usr_cedula || '—')}</td>
      <td>${escaparHtml(u.usr_correo)}</td>
      <td>${escaparHtml(formatearFecha(u.usr_fecha_nacimiento))}</td>
      <td>${escaparHtml(formatearFecha(u.usr_fecha_registro))}</td>
      <td>
        <span class="estado-badge estado-${estado}">
          ${estadoTexto}
        </span>
      </td>
      <td>
        <span class="estado-badge ${rolEsAdmin ? 'estado-activo' : 'estado-inactivo'}">
          ${rolEsAdmin ? 'Admin' : 'Usuario'}
        </span>
      </td>
      <td>
        <div class="acciones-cell">
          <button class="btn-editar" onclick="abrirEditar(${idUsuario})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Editar
          </button>
          ${botonEliminar}
        </div>
      </td>
    </tr>
  `;
      }
    )
    .join('');
}

function actualizarEstadisticas(usuarios) {
  const activos = usuarios.filter(
    (u) => u.usr_estado_usuario === 'activo'
  ).length;
  const inactivos = usuarios.filter(
    (u) => u.usr_estado_usuario !== 'activo'
  ).length;
  document.getElementById('statActivos').textContent = activos;
  document.getElementById('statInactivos').textContent = inactivos;
}

// ========== BUSCADOR ==========
document.getElementById('searchInput').addEventListener('input', (e) => {
  const termino = e.target.value.toLowerCase();
  const filtrados = todosLosUsuarios.filter(
    (u) =>
      u.usr_nombres.toLowerCase().includes(termino) ||
      u.usr_apellidos.toLowerCase().includes(termino) ||
      u.usr_correo.toLowerCase().includes(termino) ||
      String(u.usr_cedula || '').includes(termino)
  );
  renderizarTabla(filtrados);
});

// ========== INSERT — AGREGAR USUARIO ==========
document.getElementById('btnAgregarUsuario').addEventListener('click', () => {
  modoEdicion = false;
  limpiarModal();
  document.getElementById('modalTitulo').textContent = 'Agregar Usuario';
  document.getElementById('passwordGroup').style.display = 'block';
  document.getElementById('estadoGroup').style.display = 'none';
  modalAccesible.abrir(document.getElementById('modalUsuario'), {
    focoInicial: '#modalNombres',
  });
});

// ========== UPDATE — EDITAR USUARIO ==========
window.abrirEditar = function (id) {
  const usuario = todosLosUsuarios.find((u) => u.usr_id_usuario === id);
  if (!usuario) return;

  modoEdicion = true;
  limpiarModal();

  document.getElementById('modalTitulo').textContent = 'Editar Usuario';
  document.getElementById('usuarioId').value = usuario.usr_id_usuario;
  document.getElementById('modalNombres').value = usuario.usr_nombres;
  document.getElementById('modalApellidos').value = usuario.usr_apellidos;
  document.getElementById('modalCedula').value = usuario.usr_cedula || '';
  document.getElementById('modalCorreo').value = usuario.usr_correo;
  document.getElementById('modalEstado').value = usuario.usr_estado_usuario;
  document.getElementById('modalEstado').disabled = esAdministradorActual(id);

  if (usuario.usr_fecha_nacimiento) {
    document.getElementById('modalFechaNac').value = String(
      usuario.usr_fecha_nacimiento
    ).slice(0, 10);
  }

  document.getElementById('passwordGroup').style.display = 'none';
  document.getElementById('estadoGroup').style.display = 'block';
  modalAccesible.abrir(document.getElementById('modalUsuario'), {
    focoInicial: '#modalNombres',
  });
};

// ========== GUARDAR (INSERT o UPDATE) ==========
document
  .getElementById('btnGuardarUsuario')
  .addEventListener('click', async () => {
    limpiarErrores();

    const nombres = document.getElementById('modalNombres').value.trim();
    const apellidos = document.getElementById('modalApellidos').value.trim();
    const cedula = document.getElementById('modalCedula').value.trim();
    const fechaNac = document.getElementById('modalFechaNac').value;
    const correo = document.getElementById('modalCorreo').value.trim();
    const password = document.getElementById('modalPassword').value;
    const estado = document.getElementById('modalEstado').value;

    let valido = true;

    if (nombres.length < 2 || nombres.length > 100) {
      mostrarError('modalNombres', 'Ingresa nombres válidos');
      valido = false;
    }
    if (apellidos.length < 2 || apellidos.length > 100) {
      mostrarError('modalApellidos', 'Ingresa apellidos válidos');
      valido = false;
    }
    if (cedula && !esCedulaValida(cedula)) {
      mostrarError('modalCedula', 'Cédula inválida (6-20 dígitos)');
      valido = false;
    }
    if (fechaNac && !esFechaNacimientoValida(fechaNac)) {
      mostrarError('modalFechaNac', 'Ingresa una fecha de nacimiento válida');
      valido = false;
    } else if (fechaNac && !modoEdicion && !cumpleEdadMinima(fechaNac)) {
      mostrarError('modalFechaNac', 'Debes tener al menos 18 años');
      valido = false;
    }
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      mostrarError('modalCorreo', 'Correo inválido');
      valido = false;
    }
    if (!modoEdicion && !esPasswordNuevaValida(password)) {
      mostrarError(
        'modalPassword',
        'Entre 8 y 128 caracteres, 1 mayúscula, 1 minúscula y 1 número'
      );
      valido = false;
    }

    if (!valido) return;

    const btn = document.getElementById('btnGuardarUsuario');
    btn.textContent = 'Guardando...';
    btn.disabled = true;

    try {
      let res, data;

      if (modoEdicion) {
        // UPDATE
        const id = document.getElementById('usuarioId').value;
        res = await fetchAuth(`${API}/api/admin/usuario/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombres,
            apellidos,
            cedula,
            fechaNacimiento: fechaNac,
            correo,
            estado,
          }),
        });
        data = await res.json();
      } else {
        // INSERT
        res = await fetchAuth(`${API}/api/admin/usuario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombres,
            apellidos,
            cedula,
            fechaNacimiento: fechaNac,
            correo,
            password,
          }),
        });
        data = await res.json();
      }

      const mensaje =
        typeof data?.mensaje === 'string'
          ? data.mensaje
          : 'No fue posible completar la operación';

      if (res.ok && mensaje.includes('correctamente')) {
        cerrarModal();
        mostrarNotificacion('success', mensaje);
        cargarUsuarios();
      } else {
        mostrarNotificacion('error', mensaje);
      }
    } catch (err) {
      mostrarNotificacion('error', 'Error al conectar con el servidor');
    } finally {
      btn.textContent = 'Guardar';
      btn.disabled = false;
    }
  });

// ========== DELETE — ELIMINAR USUARIO ==========
window.abrirEliminar = function (id) {
  if (esAdministradorActual(id)) {
    mostrarNotificacion(
      'error',
      'No puedes eliminar tu propia cuenta de administrador'
    );
    return;
  }

  const usuario = todosLosUsuarios.find((u) => u.usr_id_usuario === id);
  const nombre = usuario
    ? `${usuario.usr_nombres} ${usuario.usr_apellidos}`
    : `usuario #${id}`;

  usuarioIdEliminar = id;
  document.getElementById('nombreEliminar').textContent = nombre;
  modalAccesible.abrir(document.getElementById('modalEliminar'), {
    focoInicial: '#btnCancelarEliminar',
  });
};

document
  .getElementById('btnConfirmarEliminar')
  .addEventListener('click', async () => {
    if (!usuarioIdEliminar) return;

    const btn = document.getElementById('btnConfirmarEliminar');
    btn.textContent = 'Eliminando...';
    btn.disabled = true;

    try {
      const res = await fetchAuth(`${API}/api/admin/usuario/${usuarioIdEliminar}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.mensaje === 'Usuario eliminado correctamente') {
        cerrarModalEliminar();
        mostrarNotificacion('success', 'Usuario eliminado correctamente');
        cargarUsuarios();
      } else {
        mostrarNotificacion('error', data.mensaje);
      }
    } catch (err) {
      mostrarNotificacion('error', 'Error al conectar con el servidor');
    } finally {
      btn.textContent = 'Eliminar';
      btn.disabled = false;
      usuarioIdEliminar = null;
    }
  });

// ========== CERRAR MODALES ==========
function cerrarModal() {
  modalAccesible.cerrar(document.getElementById('modalUsuario'));
  limpiarModal();
}

function cerrarModalEliminar() {
  modalAccesible.cerrar(document.getElementById('modalEliminar'));
  usuarioIdEliminar = null;
}

function limpiarModal() {
  document.getElementById('usuarioId').value = '';
  document.getElementById('modalNombres').value = '';
  document.getElementById('modalApellidos').value = '';
  document.getElementById('modalCedula').value = '';
  document.getElementById('modalFechaNac').value = '';
  document.getElementById('modalCorreo').value = '';
  document.getElementById('modalPassword').value = '';
  document.getElementById('modalEstado').value = 'activo';
  document.getElementById('modalEstado').disabled = false;
  limpiarErrores();
}

document
  .getElementById('btnCerrarModal')
  .addEventListener('click', cerrarModal);
document
  .getElementById('btnCancelarModal')
  .addEventListener('click', cerrarModal);
document
  .getElementById('btnCerrarEliminar')
  .addEventListener('click', cerrarModalEliminar);
document
  .getElementById('btnCancelarEliminar')
  .addEventListener('click', cerrarModalEliminar);

modalAccesible.registrar(
  document.getElementById('modalUsuario'),
  cerrarModal
);
modalAccesible.registrar(
  document.getElementById('modalEliminar'),
  cerrarModalEliminar
);

// Cerrar modal al hacer clic fuera
document.getElementById('modalUsuario').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalUsuario')) cerrarModal();
});

document.getElementById('modalEliminar').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalEliminar')) {
    cerrarModalEliminar();
  }
});

// ========== VERIFICAR SESIÓN AL CARGAR ==========
document.addEventListener('DOMContentLoaded', () => {
  const usuario = obtenerUsuarioAdminActual();

  if (!usuario) {
    redirigirAccesoNoAutorizado();
    return;
  }

  sessionStorage.setItem(
    'artifyAdmin',
    JSON.stringify({ correo: usuario.correo })
  );
  document.getElementById('adminPanel').style.display = 'block';
  document.getElementById('adminName').textContent =
    `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.correo;

  cargarUsuarios();
});
