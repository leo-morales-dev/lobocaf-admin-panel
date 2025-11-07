// /public/firebase-init.js
// Configuración compartida de Firebase para el panel
const firebaseConfig = {
  apiKey: "AIzaSyBwFKd3LFrO30e4RguksmnnGjviX2Ynur4",
  authDomain: "lobocaf-e3f49.firebaseapp.com",
  projectId: "lobocaf-e3f49",
  storageBucket: "lobocaf-e3f49.firebasestorage.app",
  messagingSenderId: "915235060785",
  appId: "1:915235060785:web:64f688de67911e030d2910",
  measurementId: "G-XFXH23TBD4"
};

if (!firebase.apps || firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}
