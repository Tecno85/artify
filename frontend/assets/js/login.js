// ========== FUNCIONES DE VALIDACIÓN ==========
function mostrarError(inputId, mensaje) {
  const input = document.getElementById(inputId);
  const errorSpan = document.getElementById(`${inputId}-error`);

  if (input && errorSpan) {
    input.classList.add('error');
    errorSpan.textContent = mensaje;
    errorSpan.classList.add('show');
  }
}

function limpiarError(inputId) {
  const input = document.getElementById(inputId);
  const errorSpan = document.getElementById(`${inputId}-error`);

  if (input && errorSpan) {
    input.classList.remove('error');
    errorSpan.classList.remove('show');
  }
}

// Toggle mostrar/ocultar contraseña
const togglePassword = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');

togglePassword.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;

  // Cambiar el icono según el estado
  if (type === 'password') {
    // Ojo abierto
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  } else {
    // Ojo tachado
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  }

  // Actualizar aria-label para accesibilidad
  togglePassword.setAttribute(
    'aria-label',
    type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña'
  );
});

// Validación del formulario
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Limpiar errores previos
  emailError.classList.remove('show');
  passwordError.classList.remove('show');
  emailInput.classList.remove('error');
  passwordInput.classList.remove('error');

  let isValid = true;

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value)) {
    emailError.textContent = 'Por favor ingresa un correo válido';
    emailError.classList.add('show');
    emailInput.classList.add('error');
    isValid = false;
  }

  // Validar contraseña
  if (passwordInput.value.length < 8) {
    passwordError.textContent =
      'La contraseña debe tener al menos 8 caracteres';
    passwordError.classList.add('show');
    passwordInput.classList.add('error');
    isValid = false;
  }

  if (isValid) {
    // Deshabilitar botón
    const btnLogin = loginForm.querySelector('button[type="submit"]');
    btnLogin.disabled = true;
    btnLogin.textContent = 'Iniciando sesión...';

    // Autenticación con backend
    fetch(`${API}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correo: emailInput.value,
        password: passwordInput.value,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar Sesión';

        if (data.mensaje === 'Login exitoso') {
          // Guardar datos del usuario en sessionStorage
          sessionStorage.setItem('artifyUser', JSON.stringify(data.usuario));
          guardarTokenAuth(data.token);

          // Redirigir según el rol del usuario
          if (data.usuario.rol === 'admin') {
            console.log('👑 Redirigiendo al panel de administración...');
            window.location.href = './admin.html';
          } else {
            console.log('🚀 Redirigiendo al editor...');
            window.location.href = './editor.html';
          }
        } else {
          mostrarError('email', data.mensaje);
        }
      })
      .catch((err) => {
        console.error('❌ Error al conectar con el servidor:', err);
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar Sesión';
        mostrarError('email', 'Error al conectar con el servidor');
      });
  }
});

// Validación en tiempo real del email
emailInput.addEventListener('blur', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailInput.value && !emailRegex.test(emailInput.value)) {
    emailError.textContent = 'Formato de correo inválido';
    emailError.classList.add('show');
    emailInput.classList.add('error');
  } else {
    emailError.classList.remove('show');
    emailInput.classList.remove('error');
  }
});
