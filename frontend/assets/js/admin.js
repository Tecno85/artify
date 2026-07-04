// ========== CONFIGURACIÓN ==========
let usuarioIdEliminar = null;
let modoEdicion = false;
let todosLosUsuarios = [];

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
  const usuarioGuardado = sessionStorage.getItem('artifyUser');
  const token = obtenerTokenAuth();

  if (usuarioGuardado && token) {
    try {
      const usuario = JSON.parse(usuarioGuardado);
      if (usuario.rol === 'usuario') {
        window.location.href = './editor.html';
        return;
      }
    } catch {}
  }

  limpiarSesionAuth();
  window.location.href = './login.html';
}

function obtenerUsuarioAdminActual() {
  const usuarioGuardado = sessionStorage.getItem('artifyUser');
  const token = obtenerTokenAuth();

  if (!usuarioGuardado || !token) {
    return null;
  }

  try {
    const usuario = JSON.parse(usuarioGuardado);
    return usuario.rol === 'admin' ? usuario : null;
  } catch {
    return null;
  }
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
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
  const idSesion = sessionStorage.getItem('artifyIdSesion');

  if (idSesion) {
    try {
      await fetchAuth(`${API}/api/sesion/cerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idSesion: parseInt(idSesion) }),
      });
      console.log('✅ Sesión cerrada correctamente');
    } catch (err) {
      console.warn('⚠️ No se pudo cerrar la sesión en el servidor');
    }
  }

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
        <td colspan="9">No se encontraron usuarios</td>
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

        return `
    <tr>
      <td>${idUsuario}</td>
      <td>${escaparHtml(u.usr_nombres)}</td>
      <td>${escaparHtml(u.usr_apellidos)}</td>
      <td>${escaparHtml(u.usr_cedula)}</td>
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
          <button class="btn-eliminar-row" onclick="abrirEliminar(${idUsuario})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
            Eliminar
          </button>
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
      u.usr_cedula.includes(termino)
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
  document.getElementById('modalUsuario').style.display = 'flex';
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
  document.getElementById('modalCedula').value = usuario.usr_cedula;
  document.getElementById('modalCorreo').value = usuario.usr_correo;
  document.getElementById('modalEstado').value = usuario.usr_estado_usuario;

  if (usuario.usr_fecha_nacimiento) {
    const fecha = new Date(usuario.usr_fecha_nacimiento);
    document.getElementById('modalFechaNac').value = fecha
      .toISOString()
      .split('T')[0];
  }

  document.getElementById('passwordGroup').style.display = 'none';
  document.getElementById('estadoGroup').style.display = 'block';
  document.getElementById('modalUsuario').style.display = 'flex';
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

    if (!nombres) {
      mostrarError('modalNombres', 'Campo requerido');
      valido = false;
    }
    if (!apellidos) {
      mostrarError('modalApellidos', 'Campo requerido');
      valido = false;
    }
    if (!cedula || !/^[0-9]{6,10}$/.test(cedula)) {
      mostrarError('modalCedula', 'Cédula inválida (6-10 dígitos)');
      valido = false;
    }
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      mostrarError('modalCorreo', 'Correo inválido');
      valido = false;
    }
    if (!modoEdicion && (!password || password.length < 8)) {
      mostrarError('modalPassword', 'Mínimo 8 caracteres');
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

      if (data.mensaje.includes('correctamente')) {
        cerrarModal();
        mostrarNotificacion('success', data.mensaje);
        cargarUsuarios();
      } else {
        mostrarError('modalCorreo', data.mensaje);
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
  const usuario = todosLosUsuarios.find((u) => u.usr_id_usuario === id);
  const nombre = usuario
    ? `${usuario.usr_nombres} ${usuario.usr_apellidos}`
    : `usuario #${id}`;

  usuarioIdEliminar = id;
  document.getElementById('nombreEliminar').textContent = nombre;
  document.getElementById('modalEliminar').style.display = 'flex';
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
        document.getElementById('modalEliminar').style.display = 'none';
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
  document.getElementById('modalUsuario').style.display = 'none';
  limpiarModal();
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
  limpiarErrores();
}

document
  .getElementById('btnCerrarModal')
  .addEventListener('click', cerrarModal);
document
  .getElementById('btnCancelarModal')
  .addEventListener('click', cerrarModal);
document.getElementById('btnCerrarEliminar').addEventListener('click', () => {
  document.getElementById('modalEliminar').style.display = 'none';
  usuarioIdEliminar = null;
});
document.getElementById('btnCancelarEliminar').addEventListener('click', () => {
  document.getElementById('modalEliminar').style.display = 'none';
  usuarioIdEliminar = null;
});

// Cerrar modal al hacer clic fuera
document.getElementById('modalUsuario').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalUsuario')) cerrarModal();
});

document.getElementById('modalEliminar').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalEliminar')) {
    document.getElementById('modalEliminar').style.display = 'none';
    usuarioIdEliminar = null;
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

  fetchAuth(`${API}/api/sesion/iniciar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idUsuario: usuario.id }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.mensaje === 'Sesión iniciada') {
        sessionStorage.setItem('artifyIdSesion', data.idSesion);
      }
    });

  cargarUsuarios();
});
