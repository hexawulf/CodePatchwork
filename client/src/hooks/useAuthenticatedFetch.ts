import { useAuth } from '@/contexts/AuthContext';

export function useAuthenticatedFetch() {
  const { currentUser } = useAuth();
  
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    // If there's a current user, add the Authorization header with their UID as the token
    if (currentUser) {
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${currentUser.uid}`,
        'Content-Type': 'application/json',
      };
      
      return fetch(url, {
        ...options,
        headers,
      });
    }
    
    // Otherwise just make a regular fetch request
    return fetch(url, options);
  };
  
  return { authenticatedFetch };
}