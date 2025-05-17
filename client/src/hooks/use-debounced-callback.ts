import { useCallback, useRef } from 'react';

/**
 * A hook that provides a debounced version of the callback function
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  // Use a ref to keep track of the timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Return a memoized version of the callback that includes debounce logic
  return useCallback(
    (...args: Parameters<T>) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}