// client/src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

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

// 2️⃣ Sanity-check: error if any of the "must have" values is missing
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

// Add Firebase domain resolution workaround
console.log("[Firebase] Adding DNS connectivity check for Firebase domains");
try {
  // Log Firebase domains we're using for debugging
  console.log("[Firebase] Using domains:", {
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectDomain: `${VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    apiDomain: "identitytoolkit.googleapis.com"
  });
  
  // Create a connectivity test
  const testConnectivity = async () => {
    try {
      // Simple connectivity check
      const testUrl = `https://${VITE_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/ping`;
      console.log(`[Firebase] Testing connectivity to: ${testUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          mode: 'no-cors', // This will prevent CORS issues
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log(`[Firebase] Connectivity test result: ${response.type}`);
        return true;
      } catch (e) {
        clearTimeout(timeoutId);
        console.error(`[Firebase] Connectivity test failed:`, e);
        return false;
      }
    } catch (e) {
      console.error(`[Firebase] Error in connectivity test:`, e);
      return false;
    }
  };
  
  // Run the test
  testConnectivity().then(connected => {
    if (!connected) {
      console.error("[Firebase] ⚠️ Connection to Firebase domains failed. This may indicate DNS issues.");
      console.error("[Firebase] ⚠️ Suggestions: 1) Check router DNS settings 2) Try a different network");
    }
  });
} catch (e) {
  console.error("[Firebase] Workaround error:", e);
}

// 4️⃣ Debug log so you can see exactly what shipped in your bundle
console.log("%c[Firebase cfg]", "color:#4ade80;", firebaseConfig);

// 5️⃣ Initialise the app (avoiding duplicates on hot-reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 6️⃣ Set up Auth + Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 7️⃣ Add direct Firebase auth state listener for debugging
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("[Firebase] Direct auth state check - User is signed in:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      providerData: user.providerData,
    });
    
    // Check if we can get an ID token
    user.getIdToken().then(token => {
      console.log("[Firebase] Successfully got ID token from direct check, length:", token.length);
    }).catch(error => {
      console.error("[Firebase] Error getting token from direct check:", error);
    });
  } else {
    console.log("[Firebase] Direct auth state check - User is signed out");
  }
});

// 8️⃣ Add direct check function to debug when needed
export const checkFirebaseAuth = async () => {
  const currentUser = auth.currentUser;
  console.log("[Firebase] Manual check - currentUser:", currentUser);
  
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken(true);
      console.log("[Firebase] Manual check - Got fresh token, length:", token.length);
      return { user: currentUser, token };
    } catch (e) {
      console.error("[Firebase] Manual check - Error getting token:", e);
      return { user: currentUser, error: e };
    }
  }
  
  return { user: null };
};

// 9️⃣ Expose Firebase objects globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).__checkFirebaseAuth = checkFirebaseAuth;
  (window as any).__firebaseApp = app;
  (window as any).__firebaseAuth = auth;
  (window as any).__googleProvider = googleProvider;
  
  // Also expose auth state checker
  (window as any).__getCurrentUser = () => {
    return auth.currentUser;
  };
  
  // And a simple auth status checker
  (window as any).__getAuthStatus = () => {
    const user = auth.currentUser;
    return {
      isSignedIn: !!user,
      user: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      } : null,
      authReady: true
    };
  };
  
  console.log("[Firebase] Added global debug functions: __checkFirebaseAuth, __firebaseApp, __firebaseAuth, __getCurrentUser, __getAuthStatus");
}
