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
  if (!authStatus) return;
  authStatus.classList.remove('status--ok');
  authStatus.classList.add('status--error');
  authStatus.textContent = message || '';
}

function showOk(message) {
  if (!authStatus) return;
  authStatus.classList.remove('status--error');
  authStatus.classList.add('status--ok');
  authStatus.textContent = message || '';
}

// Validación simple de email y habilitar botón
function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function updateLoginEnabled() {
  if (!loginBtn) return;
  const ok =
    isValidEmail((emailInput?.value || '').trim()) &&
    ((passwordInput?.value || '').trim()).length >= 6;
  if (loginBtn.textContent !== 'Ingresando…') {
    loginBtn.disabled = !ok;
  }
}
emailInput?.addEventListener('input', updateLoginEnabled);
passwordInput?.addEventListener('input', updateLoginEnabled);
updateLoginEnabled();

// Toggle mostrar/ocultar contraseña (si existe el botón en el HTML)
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

    if (authStatus) authStatus.textContent = '';
    setLoading(true);

    try {
      await auth.signInWithEmailAndPassword(email, password);
      showOk('Ingreso correcto…');
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
      updateLoginEnabled();
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
    updateLoginEnabled();
  }
});

// =======================
//   Productos (Commit 2)
// =======================

// Helpers de render
function formatCurrency(n){
  const x = Number(n);
  if (Number.isNaN(x)) return '$0.00';
  return x.toLocaleString('es-MX', { style:'currency', currency:'MXN' });
}

function renderProductsTable(products){
  const tbody = document.getElementById('productsTableBody');
  const empty = document.getElementById('emptyState');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!products || products.length === 0){
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  products.forEach(p => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    const tdPrice = document.createElement('td');
    tdName.textContent = p.name;
    tdPrice.textContent = formatCurrency(p.price);
    tdPrice.className = 'right';
    tr.appendChild(tdName);
    tr.appendChild(tdPrice);
    tbody.appendChild(tr);
  });
}

function renderKpis(products){
  const totalEl = document.getElementById('statsTotal');
  const avgEl   = document.getElementById('statsAvg');
  const maxEl   = document.getElementById('statsMax');
  const maxName = document.getElementById('statsMaxName');

  const total = products.length;
  const sum = products.reduce((acc,p)=> acc + Number(p.price||0), 0);
  const avg = total ? (sum/total) : 0;

  let max = { price: 0, name: '—' };
  products.forEach(p => {
    const price = Number(p.price||0);
    if (price > max.price) max = { price, name: p.name };
  });

  if (totalEl) totalEl.textContent = String(total);
  if (avgEl)   avgEl.textContent   = formatCurrency(avg);
  if (maxEl)   maxEl.textContent   = formatCurrency(max.price);
  if (maxName) maxName.textContent = max.name || '—';
}

// Carga/Actualiza
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
    // NUEVO: render de tabla y KPIs
    renderProductsTable(data);
    renderKpis(data);
  } catch (e) {
    showError(e.message);
  }
}

// Crear producto
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
      loadProducts(); // recarga tabla y KPIs
    } catch (e) {
      alert(e.message);
    }
  });
}