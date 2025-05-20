// client/src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 1️⃣ Pull the seven required VITE_ env-vars out of import.meta.env
const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID,
} = import.meta.env;

// 2️⃣ Sanity-check: error if any of the “must have” values is missing
if (
  !VITE_FIREBASE_API_KEY ||
  !VITE_FIREBASE_AUTH_DOMAIN ||
  !VITE_FIREBASE_PROJECT_ID
) {
  throw new Error(
    "[Firebase] Missing required VITE_FIREBASE_* env vars. " +
      "Make sure your .env is loading them."
  );
}

// 3️⃣ Build your config object
const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
  measurementId: VITE_FIREBASE_MEASUREMENT_ID,
};

// 4️⃣ Debug log so you can see exactly what shipped in your bundle
console.log("%c[Firebase cfg]", "color:#4ade80;", firebaseConfig);

// 5️⃣ Initialise the app (avoiding duplicates on hot-reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 6️⃣ Set up Auth + Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
