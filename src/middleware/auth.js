const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let attemptedInitialization = false;
let lastInitializationError = null;

function ensureFirebaseApp() {
  if (admin.apps.length) {
    lastInitializationError = null;
    attemptedInitialization = true;
    return { ok: true };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const error = new Error('Faltan credenciales de Firebase Admin (FIREBASE_* en .env)');
    if (!attemptedInitialization) {
      console.warn('[WARN] ' + error.message);
    }
    attemptedInitialization = true;
    lastInitializationError = error;
    return { ok: false, error };
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    attemptedInitialization = true;
    lastInitializationError = null;
    return { ok: true };
  } catch (error) {
    if (!attemptedInitialization) {
      console.error('[ERROR] Firebase Admin initialization failed:', error.message);
    }
    attemptedInitialization = true;
    lastInitializationError = error;
    return { ok: false, error };
  }
}

async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization: Bearer <idToken>' });
  }

  const status = ensureFirebaseApp();
  if (!status.ok) {
    return res.status(500).json({
      error: 'Firebase Admin no inicializado',
      details: status.error ? status.error.message : undefined,
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  ensureFirebaseApp,
  verifyAuth,
  getFirebaseInitializationError: () => lastInitializationError,
};
