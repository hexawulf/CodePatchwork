/* ------------------------------------------------------------------
 * Firebase bootstrap for CodePatchwork
 * ------------------------------------------------------------------ */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { tempFirebaseConfig } from "../temp-firebase-config";

/* ------------------------------------------------------------------
 * 1. Build the Firebase config
 *    – Prefer VITE_* env vars injected by Vite
 *    – Fall back to tempFirebaseConfig when they’re missing (local dev)
 * ------------------------------------------------------------------ */
const envConfigOK =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = envConfigOK
  ? {
      apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    }
  : tempFirebaseConfig;

//  🔍  Runtime probe — prints the actual config that ships in the bundle
console.log("%c[Firebase cfg]", "color:#4ade80;", firebaseConfig);

/* ------------------------------------------------------------------
 * 2. Initialise (avoid duplicates in hot-reload)
 * ------------------------------------------------------------------ */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/* ------------------------------------------------------------------
 * 3. Auth + Google provider
 * ------------------------------------------------------------------ */
const auth           = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/* ------------------------------------------------------------------
 * 4. OPTIONAL: expose handles for DevTools inspection (dev builds only)
 * ------------------------------------------------------------------ */
if (import.meta.env.MODE !== "production" && typeof window !== "undefined") {
  // @ts-ignore  intentional debug attachment
  window.__app  = app;
  // @ts-ignore
  window.__auth = auth;
  // @ts-ignore
  window.__prov = googleProvider;
}

/* ------------------------------------------------------------------
 * 5. Exports
 * ------------------------------------------------------------------ */
export { app, auth, googleProvider };
