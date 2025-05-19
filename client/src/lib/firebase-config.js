// client/src/lib/firebase-config.js

// NB: this file no longer imports a hard-coded fallback.
//     We expect ALL of these to be defined in your .env (via VITE_…).

const {
  VITE_FIREBASE_API_KEY: apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: authDomain,
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  VITE_FIREBASE_APP_ID: appId,
  VITE_FIREBASE_MEASUREMENT_ID: measurementId,
} = import.meta.env;

// sanity check – fail fast if you forgot to set any of these
for (const [key, val] of Object.entries({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId })) {
  if (!val) {
    throw new Error(`Missing Firebase env-var VITE_${key.toUpperCase()}`);
  }
}

export default {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  // measurementId is optional in SDK v9+, so we only include it if present
  ...(measurementId ? { measurementId } : {}),
};
