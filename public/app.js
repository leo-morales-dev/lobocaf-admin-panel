
const auth = firebase.auth();
let idToken = null;

const authSection = document.getElementById('auth');
const appSection = document.getElementById('app');
const authStatus = document.getElementById('authStatus');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    authStatus.textContent = 'Error: ' + e.message;
  }
});

logoutBtn.addEventListener('click', async () => {
  await auth.signOut();
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    idToken = await user.getIdToken();
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    loadProducts();
  } else {
    idToken = null;
    authSection.style.display = 'block';
    appSection.style.display = 'none';
  }
});

async function loadProducts() {
  const res = await fetch('/api/products', {
    headers: { 'Authorization': 'Bearer ' + idToken }
  });
  const data = await res.json();
  const list = document.getElementById('list');
  list.innerHTML = '';
  data.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.name} — $${p.price.toFixed(2)}`;
    list.appendChild(li);
  });
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + idToken
    },
    body: JSON.stringify({ name, price })
  });
  if (res.ok) {
    document.getElementById('name').value = '';
    document.getElementById('price').value = '';
    loadProducts();
  } else {
    const err = await res.json();
    alert('Error: ' + (err.error || 'unknown'));
  }
});
