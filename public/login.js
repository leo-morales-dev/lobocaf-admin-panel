// /public/login.js
const auth = firebase.auth();
const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const statusEl = document.getElementById('authStatus');

if (loginBtn) {
  loginBtn.disabled = true;
  loginBtn.dataset.loading = 'false';
}

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.classList.toggle('is-error', Boolean(isError));
}

function setLoading(isLoading) {
  if (!loginBtn) return;
  loginBtn.disabled = isLoading;
  loginBtn.dataset.loading = isLoading ? 'true' : 'false';
  loginBtn.textContent = isLoading ? 'Entrando…' : 'Iniciar sesión';
}

function updateButtonState() {
  if (!loginBtn) return;
  const email = (emailInput?.value || '').trim();
  const password = (passwordInput?.value || '').trim();
  const ok = email.length > 0 && password.length >= 6;
  if (loginBtn.dataset.loading === 'true') return;
  loginBtn.disabled = !ok;
}

emailInput?.addEventListener('input', updateButtonState);
passwordInput?.addEventListener('input', updateButtonState);
updateButtonState();

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = (emailInput?.value || '').trim();
  const password = (passwordInput?.value || '').trim();
  if (!email || !password) {
    setStatus('Completa ambos campos para continuar.', true);
    return;
  }

  setStatus('');
  setLoading(true);
  try {
    await auth.signInWithEmailAndPassword(email, password);
    setStatus('Acceso concedido. Redirigiendo…', false);
  } catch (error) {
    const messages = {
      'auth/invalid-email': 'El correo es inválido.',
      'auth/user-disabled': 'El usuario está deshabilitado.',
      'auth/user-not-found': 'Usuario no encontrado.',
      'auth/wrong-password': 'La contraseña es incorrecta.',
      'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.'
    };
    setStatus(messages[error.code] || 'No se pudo iniciar sesión.', true);
  } finally {
    setLoading(false);
    updateButtonState();
  }
});

auth.onAuthStateChanged((user) => {
  if (user) {
    window.location.replace('/crm');
  }
});
