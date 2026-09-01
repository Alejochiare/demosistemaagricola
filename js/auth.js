/* ============================================================
   AgroGestión — Autenticación
   Pantalla de login (Firebase Authentication) que bloquea el
   acceso a la app hasta que haya una sesión válida.
   ============================================================ */

const Auth = (() => {

  let resolveReady;
  const readyPromise = new Promise((resolve) => { resolveReady = resolve; });

  const ERROR_MESSAGES = {
    'auth/invalid-email': 'Email inválido.',
    'auth/user-not-found': 'No existe una cuenta con ese email.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Probá de nuevo en unos minutos.',
    'auth/network-request-failed': 'Sin conexión. Revisá tu internet e intentá de nuevo.',
  };

  function init() {
    const gate = document.getElementById('authGate');
    const form = document.getElementById('authForm');
    const errorEl = document.getElementById('authError');
    const submitBtn = document.getElementById('authSubmit');

    firebase.auth().onAuthStateChanged((user) => {
      gate.hidden = !!user;
      if (user) resolveReady(user);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Ingresando…';

      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;

      firebase.auth().signInWithEmailAndPassword(email, password)
        .catch((err) => {
          errorEl.textContent = ERROR_MESSAGES[err.code] || 'No se pudo iniciar sesión. Intentá de nuevo.';
          errorEl.hidden = false;
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Ingresar';
        });
    });
  }

  function signOut() {
    firebase.auth().signOut().then(() => location.reload());
  }

  function whenReady() {
    return readyPromise;
  }

  document.addEventListener('DOMContentLoaded', init);

  return { whenReady, signOut };
})();
