// /public/crm.js
const auth = firebase.auth();
let idToken = null;

const logoutBtn = document.getElementById('logoutBtn');
const addForm = document.getElementById('addForm');
const searchInput = document.getElementById('searchProducts');
const filterSelect = document.getElementById('segmentFilter');
const statusBanner = document.getElementById('statusBanner');

function setStatus(message, isError = true) {
  if (!statusBanner) return;
  statusBanner.textContent = message || '';
  if (!message) {
    statusBanner.style.color = '#5b6577';
  } else {
    statusBanner.style.color = isError ? '#c2382b' : '#227b4d';
  }
}

logoutBtn?.addEventListener('click', async () => {
  try {
    await auth.signOut();
  } catch (error) {
    setStatus('No se pudo cerrar sesión.', true);
  }
});

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.replace('/');
    return;
  }
  try {
    idToken = await user.getIdToken();
  } catch (error) {
    setStatus('No se pudo validar la sesión.', true);
    return;
  }
  setStatus('');
  loadProducts();
});

let productsData = [];
let currentSearch = '';
let currentFilter = 'all';

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return '$0.00';
  return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function getSegment(price) {
  const amount = Number(price) || 0;
  if (amount >= 60) return { label: 'Premium', slug: 'premium' };
  if (amount >= 35) return { label: 'Ticket medio', slug: 'media' };
  return { label: 'Básico', slug: 'basico' };
}

function renderKpis(products) {
  const totalEl = document.getElementById('statsTotal');
  const avgEl = document.getElementById('statsAvg');
  const maxEl = document.getElementById('statsMax');
  const maxNameEl = document.getElementById('statsMaxName');
  const premiumEl = document.getElementById('statsPremium');

  const total = products.length;
  const sum = products.reduce((acc, p) => acc + Number(p.price || 0), 0);
  const avg = total ? sum / total : 0;
  let maxProduct = { price: 0, name: '—' };
  let premiumCount = 0;

  products.forEach((product) => {
    const price = Number(product.price || 0);
    if (price > maxProduct.price) {
      maxProduct = { price, name: product.name || '—' };
    }
    if (price >= 60) {
      premiumCount += 1;
    }
  });

  if (totalEl) totalEl.textContent = String(total);
  if (avgEl) avgEl.textContent = formatCurrency(avg);
  if (maxEl) maxEl.textContent = formatCurrency(maxProduct.price);
  if (maxNameEl) maxNameEl.textContent = maxProduct.name;
  if (premiumEl) premiumEl.textContent = String(premiumCount);
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  const emptyState = document.getElementById('emptyState');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!products || products.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
      const hasProducts = Array.isArray(productsData) && productsData.length > 0;
      emptyState.textContent = hasProducts
        ? 'No hay productos que coincidan con tu búsqueda o filtro.'
        : 'No hay productos aún.';
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  products.forEach((product) => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = product.name || '—';

    const tdSegment = document.createElement('td');
    const segment = getSegment(product.price);
    tdSegment.textContent = segment.label;

    const tdPrice = document.createElement('td');
    tdPrice.textContent = formatCurrency(product.price);
    tdPrice.classList.add('number');

    tr.append(tdName, tdSegment, tdPrice);
    tbody.appendChild(tr);
  });
}

function applyFilters() {
  let filtered = productsData.slice();
  if (currentSearch) {
    const term = currentSearch.toLowerCase();
    filtered = filtered.filter((item) => (item.name || '').toLowerCase().includes(term));
  }
  if (currentFilter !== 'all') {
    filtered = filtered.filter((item) => getSegment(item.price).slug === currentFilter);
  }
  renderProductsTable(filtered);
}

async function loadProducts() {
  if (!idToken) return;
  try {
    const response = await fetch('/api/products', {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (!response.ok) {
      if (response.status === 401) {
        setStatus('Tu sesión expiró. Inicia sesión nuevamente.', true);
        await auth.signOut();
        return;
      }
      throw new Error(`Error al cargar productos (${response.status})`);
    }
    const data = await response.json();
    productsData = Array.isArray(data) ? data : [];
    renderKpis(productsData);
    applyFilters();
    setStatus('', false);
  } catch (error) {
    setStatus(error.message || 'No se pudieron cargar los productos.', true);
  }
}

addForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!idToken) return;
  const name = document.getElementById('name').value.trim();
  const priceValue = document.getElementById('price').value;
  const price = Number.parseFloat(priceValue);
  if (!name || Number.isNaN(price)) {
    setStatus('Completa un nombre y precio válidos.', true);
    return;
  }

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({ name, price })
    });
    if (!response.ok) {
      throw new Error('No se pudo guardar el producto.');
    }
    document.getElementById('name').value = '';
    document.getElementById('price').value = '';
    setStatus('Producto agregado correctamente.', false);
    await loadProducts();
  } catch (error) {
    setStatus(error.message || 'Error al guardar el producto.', true);
  }
});

searchInput?.addEventListener('input', (event) => {
  currentSearch = (event.target.value || '').trim();
  applyFilters();
});

filterSelect?.addEventListener('change', (event) => {
  currentFilter = event.target.value;
  applyFilters();
});
