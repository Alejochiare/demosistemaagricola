/* ============================================================
   AgroGestión — Configuración de Firebase
   Reemplazá estos valores por los de tu proyecto:
   Firebase Console → ⚙ Configuración del proyecto → Tus apps → SDK de Firebase.
   No son secretos (viajan en el cliente); la seguridad la dan las
   reglas de Firestore + Authentication, no ocultar estos valores.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  projectId: 'TU_PROYECTO',
  storageBucket: 'TU_PROYECTO.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxxxx',
};

firebase.initializeApp(FIREBASE_CONFIG);
