import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
  Auth
} from 'firebase/auth';
import { auth as firebaseAuth, googleProvider as firebaseGoogleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Type assertions to ensure TypeScript understands our imports from firebase.ts
const auth = firebaseAuth as Auth;
const googleProvider = firebaseGoogleProvider as GoogleAuthProvider;

interface AuthContextProps {
  currentUser: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Function to register user with our backend
  async function registerUserWithBackend(user: User) {
    try {
      if (user) {
        await fetch('/api/auth/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          })
        });
      }
    } catch (error) {
      console.error("Error syncing user with backend:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Register the user with our backend when they authenticate
      if (user) {
        registerUserWithBackend(user)
          .catch(error => console.error("Failed to register user with backend:", error));
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Register with our backend
      await registerUserWithBackend(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during sign up';
      toast({
        title: 'Sign up failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }

  async function login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Register with our backend
      await registerUserWithBackend(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during login';
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }

  async function logout(): Promise<void> {
    try {
      await signOut(auth);
      // No need to update backend as we're checking auth state in our API
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during logout';
      toast({
        title: 'Logout failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }

  async function resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for further instructions',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during password reset';
      toast({
        title: 'Password reset failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }

  async function signInWithGoogle(): Promise<User> {
    try {
      console.log("Starting Google sign-in process...");
      
      // Ensure Firebase auth is available
      if (!auth) {
        throw new Error("Firebase authentication is not available");
      }
      
      // Create a new GoogleAuthProvider instance for this sign-in attempt
      // This ensures we have a fresh provider each time
      const provider = new GoogleAuthProvider();
      
      // Add the scopes we need
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Use popup for mobile compatibility
      const result = await signInWithPopup(auth, provider);
      
      // Log success info (for debugging)
      console.log("Google sign in successful");
      
      // Register with our backend
      await registerUserWithBackend(result.user);
      return result.user;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      // Provide a more user-friendly error message
      let errorMessage = 'An error occurred during Google sign in';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'The sign-in popup was closed before completing the process.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'The operation was cancelled.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google sign-in. Please add this domain to your Firebase console under Authentication > Settings > Authorized domains.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase configuration error. Please try email/password login or contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Google sign in failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }

  async function updateUserProfile(displayName: string): Promise<void> {
    try {
      if (currentUser) {
        await updateProfile(currentUser, { displayName });
        // Force refresh the user object
        setCurrentUser({ ...currentUser });
        
        // Update user profile in our backend
        await registerUserWithBackend(currentUser);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred while updating profile';
      toast({
        title: 'Profile update failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }

  const value = {
    currentUser,
    isLoading,
    signUp,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}