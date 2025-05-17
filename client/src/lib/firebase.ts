import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Log Firebase config for debugging (excluding sensitive data)
console.log("Firebase project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("Firebase auth domain:", `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google provider
export const googleProvider = new GoogleAuthProvider();
// Add scopes here to ensure they're always included
googleProvider.addScope('profile');
googleProvider.addScope('email');

export default app;