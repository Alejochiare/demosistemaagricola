# AgroGestión

Sistema de gestión agrícola para el control de lotes, cultivos, siembras, fumigaciones, cosechas y notas operativas.

## Estructura

```
demosistemaagricola/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── data.js
│   └── ui.js
└── docs/
    └── prompt-sistema-agricola.md
```

## Desarrollo local

Es una aplicación estática (HTML/CSS/JS sin build). Basta con abrir `index.html` con Live Server (VS Code) o cualquier servidor estático — abrirla con `file://` directo puede tener restricciones del navegador con `fetch`.

## Despliegue (GitHub Pages)

1. Publicar el repositorio en GitHub (vía GitHub Desktop).
2. En GitHub → Settings → Pages → Source: rama `main`, carpeta `/ (root)`.
3. El sitio queda disponible en `https://<usuario>.github.io/<repo>/`.

## Datos y autenticación (Firebase)

Los datos viven en Firestore (documento único `agrogestion/main`) con `localStorage` como caché/respaldo offline — ver `js/data.js` (módulo `DB`). El acceso está protegido con Firebase Authentication (email/contraseña) — ver `js/auth.js` y la pantalla de login en `index.html`.

### Configurar tu proyecto de Firebase

1. Entrá a [Firebase Console](https://console.firebase.google.com/) → **Add project** → creá el proyecto (podés desactivar Google Analytics).
2. **Build → Firestore Database → Create database** → modo producción → elegí una región.
3. **Build → Authentication → Get started → Sign-in method → Email/Password** → habilitalo.
4. **Authentication → Users → Add user** → cargá tu email y contraseña (no hay pantalla de registro público a propósito; los usuarios se crean acá).
5. **⚙ Configuración del proyecto → Tus apps → Web (`</>`)** → registrá una app → copiá el objeto `firebaseConfig`.
6. Pegá esos valores en [`js/firebase-config.js`](js/firebase-config.js) (no son secretos, se pueden commitear).
7. En **Firestore → Reglas**, pegá:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /agrogestion/{docId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

Con eso, cada cambio en la app se guarda en Firestore (con debounce de 500ms) y al abrir la app en otro dispositivo, tras iniciar sesión, se trae el estado más reciente.
