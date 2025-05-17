import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSignUpClick?: () => void;
  onForgotPasswordClick?: () => void;
}

export default function LoginForm({ 
  onSuccess, 
  onSignUpClick,
  onForgotPasswordClick 
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setIsLoading(true);
      await login(values.email, values.password);
      toast({
        title: 'Login successful',
        description: 'Welcome back to CodeCanvas!',
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error is already handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log("Starting Google sign-in process...");
      await signInWithGoogle();
      console.log("Google sign-in completed successfully");
      toast({
        title: 'Login successful',
        description: 'Welcome to CodePatchwork!',
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.log("Google sign-in error in component:", error);
      // Handle specific errors here with user-friendly messages
      if ((error as any)?.code === 'auth/unauthorized-domain') {
        toast({
          title: 'Domain Not Authorized',
          description: 'This domain is not authorized for Firebase authentication. Please use email/password login or contact the administrator.',
          variant: 'destructive'
        });
      } else if ((error as any)?.code === 'auth/configuration-not-found') {
        toast({
          title: 'Firebase Configuration Error',
          description: 'There is an issue with the Firebase configuration. Please try email/password login instead.',
          variant: 'destructive'
        });
      } else if ((error as any)?.code === 'auth/popup-blocked') {
        toast({
          title: 'Popup Blocked',
          description: 'The sign-in popup was blocked by your browser. Please allow popups for this site.',
          variant: 'destructive'
        });
      } else if ((error as any)?.code === 'auth/cancelled-popup-request' || (error as any)?.code === 'auth/popup-closed-by-user') {
        // User canceled, just show a subtle message
        toast({
          title: 'Sign-in canceled',
          description: 'Google sign-in was canceled. You can try again or use email/password.',
        });
      } else {
        // Generic error handling
        toast({
          title: 'Google sign-in failed',
          description: (error as any)?.message || 'An unknown error occurred. Please try another sign-in method.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Login to CodeCanvas</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your credentials to access your account
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="yourname@example.com" 
                    {...field} 
                    disabled={isLoading || isGoogleLoading} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    disabled={isLoading || isGoogleLoading} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log in
          </Button>
        </form>
      </Form>
      
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
        </div>
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full" 
        onClick={handleGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
        )}
        Sign in with Google
      </Button>
      
      <div className="text-center text-sm">
        <Button 
          variant="link" 
          className="text-blue-500 dark:text-blue-400" 
          onClick={onForgotPasswordClick}
          disabled={isLoading || isGoogleLoading}
        >
          Forgot your password?
        </Button>
      </div>
      
      <div className="text-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">Don't have an account?</span>{' '}
        <Button 
          variant="link" 
          className="text-blue-500 dark:text-blue-400" 
          onClick={onSignUpClick}
          disabled={isLoading || isGoogleLoading}
        >
          Sign up
        </Button>
      </div>
    </div>
  );
}