import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile 
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during Google sign in';
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