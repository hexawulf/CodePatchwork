import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup' | 'forgot-password';

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthMode;
}

export default function AuthDialog({
  isOpen,
  onOpenChange,
  defaultMode = 'login',
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSuccess = () => {
    onOpenChange(false);
    toast({
      title: mode === 'login' ? 'Welcome back!' : 'Account created!',
      description: 'You are now signed in.',
    });
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
  };

  const handleBackToLogin = () => {
    setMode('login');
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign In';
      case 'signup':
        return 'Create Account';
      case 'forgot-password':
        return 'Reset Password';
      default:
        return 'Authentication';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to your CodeCanvas account';
      case 'signup':
        return 'Create a new CodeCanvas account';
      case 'forgot-password':
        return 'Enter your email to reset your password';
      default:
        return '';
    }
  };

  // If user is already logged in, don't show the dialog
  if (currentUser && isOpen) {
    onOpenChange(false);
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {mode === 'login' && (
          <LoginForm
            onSuccess={handleSuccess}
            onSignUpClick={() => setMode('signup')}
            onForgotPasswordClick={handleForgotPassword}
          />
        )}

        {mode === 'signup' && (
          <SignUpForm
            onSuccess={handleSuccess}
            onLoginClick={() => setMode('login')}
          />
        )}

        {mode === 'forgot-password' && (
          <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
        )}
      </DialogContent>
    </Dialog>
  );
}