import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User, Bug, RefreshCw } from 'lucide-react';
import AuthDialog from './auth/AuthDialog';
import { useToast } from '@/hooks/use-toast';

// Fallback function to directly check localStorage if context fails
function getAuthUserFromStorage() {
  try {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  } catch (e) {
    console.error('[UserProfileButton] Error parsing stored user:', e);
    return null;
  }
}

export default function UserProfileButton() {
  // Capture raw AuthContext first to debug it
  const contextValue = useAuthContext();
  console.log('[UserProfileButton] Raw AuthContext:', contextValue);
  
  // Extract expected properties
  const { user: contextUser, signOut, loading } = contextValue;
  
  // Setup alternative user source from localStorage as fallback
  const [fallbackUser, setFallbackUser] = useState(getAuthUserFromStorage());
  const [forceAuthenticated, setForceAuthenticated] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugCounts, setDebugCounts] = useState({ contextCheck: 0, storageCheck: 0 });
  const authIssueDetected = useRef(false);
  const checkInterval = useRef<number | null>(null);
  
  // If we need to, we'll use fallback
  const user = contextUser || fallbackUser;
  
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { toast } = useToast();

  // Function to force check auth state - can be called manually
  const forceAuthCheck = () => {
    console.log('[UserProfileButton] Manual auth check triggered');
    
    // Always re-read from localStorage
    const storedUser = getAuthUserFromStorage();
    setDebugCounts(prev => ({ ...prev, storageCheck: prev.storageCheck + 1 }));
    
    // Update our knowledge of the context
    setDebugCounts(prev => ({ ...prev, contextCheck: prev.contextCheck + 1 }));
    
    if (storedUser && !contextUser) {
      console.log('[UserProfileButton] Manual check found user in localStorage but not in context');
      setFallbackUser(storedUser);
      setForceAuthenticated(true);
      authIssueDetected.current = true;
      
      toast({
        title: 'Auth Fallback Activated',
        description: 'Using localStorage authentication data since context is missing.',
      });
      
      return true;
    } else if (contextUser) {
      console.log('[UserProfileButton] Manual check found user in context:', contextUser.email);
      return true;
    } else if (!storedUser && !contextUser) {
      console.log('[UserProfileButton] Manual check found no user in storage or context');
      setFallbackUser(null);
      setForceAuthenticated(false);
      return false;
    }
    
    return !!contextUser || !!storedUser;
  };
  
  // Check localStorage on mount and periodically
  useEffect(() => {
    console.log('[UserProfileButton] Component mounted');
    
    // Immediate check on mount
    const storedUser = getAuthUserFromStorage();
    if (storedUser && !contextUser && !authIssueDetected.current) {
      console.log('[UserProfileButton] Found user in localStorage but not in context, using fallback');
      setFallbackUser(storedUser);
      setForceAuthenticated(true);
      authIssueDetected.current = true;
      
      toast({
        title: 'Authentication Status',
        description: 'User session detected in storage but not in context. Using backup authentication.',
      });
    }
    
    // Setup periodic localStorage check in case auth state changes
    if (checkInterval.current === null) {
      checkInterval.current = window.setInterval(() => {
        const latestStoredUser = getAuthUserFromStorage();
        
        // Log full context value every few seconds to debug
        console.log('[UserProfileButton] Periodic check context:', { 
          contextUser: contextUser ? {
            email: contextUser.email,
            id: contextUser.id
          } : null,
          contextIsAuthenticated: contextValue.isAuthenticated,
          storedUserExists: !!latestStoredUser,
          currentForceState: forceAuthenticated
        });
        
        if (latestStoredUser && !contextUser && !authIssueDetected.current) {
          console.log('[UserProfileButton] Auth state inconsistency detected, activating fallback');
          setFallbackUser(latestStoredUser);
          setForceAuthenticated(true);
          authIssueDetected.current = true;
        } else if (!latestStoredUser && forceAuthenticated) {
          console.log('[UserProfileButton] User no longer in localStorage, deactivating fallback');
          setFallbackUser(null);
          setForceAuthenticated(false);
        }
      }, 2000);
      
      console.log('[UserProfileButton] Set up periodic auth check interval:', checkInterval.current);
    }
    
    return () => {
      console.log('[UserProfileButton] Component unmounting, clearing interval');
      if (checkInterval.current !== null) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    };
  }, [contextUser, forceAuthenticated]);

  // Clear force authenticated if we get a context user
  useEffect(() => {
    if (contextUser && forceAuthenticated) {
      console.log('[UserProfileButton] Context user found, clearing forced auth state');
      setForceAuthenticated(false);
    }
  }, [contextUser]);

  const handleLogout = async () => {
    console.log('[UserProfileButton] Logout started');
    try {
      // Always clear localStorage first
      localStorage.removeItem('auth_user');
      setFallbackUser(null);
      setForceAuthenticated(false);
      authIssueDetected.current = false;
      
      // Then try context logout
      if (typeof signOut === 'function') {
        console.log('[UserProfileButton] Calling context signOut function');
        await signOut();
      } else {
        console.log('[UserProfileButton] No signOut function in context');
      }
      
      console.log('[UserProfileButton] Logout completed');
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account',
      });
      
      // Extra check to ensure we're really logged out
      setTimeout(() => {
        if (getAuthUserFromStorage()) {
          console.warn('[UserProfileButton] User still in localStorage after logout!');
          localStorage.removeItem('auth_user');
        }
      }, 500);
    } catch (error) {
      console.error('[UserProfileButton] Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const renderAuthenticatedView = () => {
    console.log('[UserProfil
