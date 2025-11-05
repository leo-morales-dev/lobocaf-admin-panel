
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

## Cómo modificar las reglas de protección en GitHub
Si ves mensajes como “Review required” o “Merging is blocked”, significa que la rama tiene
reglas de protección activas. Para ajustarlas necesitas permisos de administrador en el
repositorio:

1. Ingresa a GitHub y abre el repositorio.
2. Ve a **Settings → Branches → Branch protection rules**.
3. Selecciona la regla (por ejemplo, la de `main`) y haz clic en **Edit**.
4. Ajusta las opciones necesarias (requerir aprobaciones, checks, etc.).
5. Guarda con **Save changes**. Si quieres eliminarla por completo, usa **Delete this rule**.

Los colaboradores sin permisos de administrador no pueden modificar estas reglas; deberán
pedir a alguien con acceso que lo haga.

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
