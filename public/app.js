// Firebase (compat)
const auth = firebase.auth();
let idToken = null;

// UI elements
const authSection = document.getElementById('auth');
const appSection = document.getElementById('app');
const authStatus = document.getElementById('authStatus');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addForm = document.getElementById('addForm');

// NUEVO: refs para validación y toggle contraseña
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePwd = document.getElementById('togglePwd');

// ---- Utilidades de UI ----
function setLoading(isLoading) {
  if (!loginBtn) return;
  loginBtn.disabled = isLoading;
  loginBtn.textContent = isLoading ? 'Ingresando…' : 'Iniciar sesión';
}

function showError(message) {
  if (authStatus) authStatus.textContent = message || '';
}

// NUEVO: validación simple de email y habilitar botón
function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function updateLoginEnabled() {
  if (!loginBtn) return;
  const ok =
    isValidEmail((emailInput?.value || '').trim()) &&
    ((passwordInput?.value || '').trim()).length >= 6;
  loginBtn.disabled = !ok;
}
// listeners para validación en tiempo real
emailInput?.addEventListener('input', updateLoginEnabled);
passwordInput?.addEventListener('input', updateLoginEnabled);
// evalúa estado inicial
updateLoginEnabled();

// NUEVO: toggle mostrar/ocultar contraseña (si existe el botón en el HTML)
if (togglePwd) {
  togglePwd.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    togglePwd.setAttribute('aria-pressed', String(show));
    togglePwd.textContent = show ? '🙈' : '👁';
    passwordInput.focus();
  });
}

// ---- Auth: login / logout ----
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = (emailInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();

    showError('');
    setLoading(true);

    try {
      await auth.signInWithEmailAndPassword(email, password);

      // (Opcional) feedback breve antes de cambiar vista
      // if (authStatus) { authStatus.textContent = 'Ingreso correcto…'; }
    } catch (e) {
      const map = {
        'auth/invalid-email': 'El correo no es válido.',
        'auth/user-disabled': 'El usuario está deshabilitado.',
        'auth/user-not-found': 'Usuario no encontrado.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.'
      };
      showError(map[e.code] || ('Error: ' + e.message));
    } finally {
      setLoading(false);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
    } catch (e) {
      alert('No se pudo cerrar sesión: ' + e.message);
    }
  });
}

// ---- Estado de sesión ----
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      idToken = await user.getIdToken();
    } catch (_) {
      idToken = null;
    }
    if (authSection) authSection.style.display = 'none';
    if (appSection) appSection.style.display = 'block';
    loadProducts();
  } else {
    idToken = null;
    if (authSection) authSection.style.display = 'block';
    if (appSection) appSection.style.display = 'none';
  }
});

// ---- Productos ----
async function loadProducts() {
  if (!idToken) return;
  try {
    const res = await fetch('/api/products', {
      headers: { 'Authorization': 'Bearer ' + idToken }
    });

    if (!res.ok) {
      if (res.status === 401) {
        showError('Tu sesión expiró. Vuelve a iniciar sesión.');
        await auth.signOut();
        return;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error al cargar productos (${res.status})`);
    }

    const data = await res.json();
    const list = document.getElementById('list');
    if (!list) return;

    list.innerHTML = '';
    data.forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.name} — $${Number(p.price).toFixed(2)}`;
      list.appendChild(li);
    });
  } catch (e) {
    showError(e.message);
  }
}

if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!idToken) return;

    const name = document.getElementById('name').value.trim();
    const priceValue = document.getElementById('price').value;
    const price = Number.parseFloat(priceValue);

    if (!name || Number.isNaN(price)) {
      alert('Completa nombre y precio válidos.');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + idToken
        },
        body: JSON.stringify({ name, price })
      });

      if (!res.ok) {
        if (res.status === 401) {
          showError('Tu sesión expiró. Vuelve a iniciar sesión.');
          await auth.signOut();
          return;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error al crear producto (${res.status})`);
      }

      document.getElementById('name').value = '';
      document.getElementById('price').value = '';
      loadProducts();
    } catch (e) {
      alert(e.message);
    }
  });
}
