/* ============================================================
   AgroGestión — Configuración de Firebase
   Reemplazá estos valores por los de tu proyecto:
   Firebase Console → ⚙ Configuración del proyecto → Tus apps → SDK de Firebase.
   No son secretos (viajan en el cliente); la seguridad la dan las
   reglas de Firestore + Authentication, no ocultar estos valores.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCsvJ9Bl1mBsPndtqA-Z8fD406PKaYTBAc',
  authDomain: 'agrogestion-fc703.firebaseapp.com',
  projectId: 'agrogestion-fc703',
  storageBucket: 'agrogestion-fc703.firebasestorage.app',
  messagingSenderId: '305440618142',
  appId: '1:305440618142:web:131477d416d19f66256d8f',
};

firebase.initializeApp(FIREBASE_CONFIG);
