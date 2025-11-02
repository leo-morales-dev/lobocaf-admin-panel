
# LoboCaf – Panel Administrativo (Node.js + Firebase Auth)

Admin web para agregar y listar productos de la cafetería universitaria. Requiere **inicio de sesión con Firebase** (solo login, sin registro ni recuperación).

## Stack
- Node.js + Express
- Firebase Admin SDK (verificación de ID Token)
- SQLite (persistencia simple)
- Frontend vanilla (HTML + JS) con Firebase Web SDK

## Requisitos previos
- Node 18+
- Proyecto Firebase con Authentication (Email/Password) habilitado y usuarios ya creados desde la consola (no hay registro).
- Crear una **Service Account** y copiar las credenciales a `.env` según `.env.example`.

## Configuración
```bash
cp .env.example .env
# Edita .env con FIREBASE_* y el PORT si deseas
npm install
npm run dev
# abre http://localhost:3000
```

## Flujo de autenticación
1) El usuario inicia sesión desde la página `/` usando Firebase Web SDK (Email/Password).
2) El front obtiene un **ID Token** (`getIdToken()`).
3) Las peticiones a la API (`/api/products`) se envían con `Authorization: Bearer <ID_TOKEN>`.
4) El backend verifica el token con Firebase Admin (middleware `auth.js`).

## Endpoints
- `GET /api/products` – lista productos
- `POST /api/products` – crea producto `{ name, price }`

## Tests
```bash
npm test
```

## CI (GitHub Actions)
Archivo en `.github/workflows/ci.yml` ejecuta install + test en cada push/pull_request.

## Estructura
```text
src/
  app.js
  db.js
  routes/products.js
  middleware/auth.js
public/
  index.html
  app.js
tests/
  products.test.js
.github/workflows/ci.yml
```
