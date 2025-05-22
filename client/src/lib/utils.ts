import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Safely converts any className value to a string
 * Handles objects, arrays, and other non-string values
 */
export function safeClassName(className: any): string {
  if (typeof className === 'string') {
    return className;
  }
  
  if (className === null || className === undefined) {
    return '';
  }
  
  // Handle SVGAnimatedString (the main culprit)
  if (className && typeof className === 'object' && 'baseVal' in className) {
    return className.baseVal || '';
  }
  
  // Handle arrays
  if (Array.isArray(className)) {
    return className.map(safeClassName).filter(Boolean).join(' ');
  }
  
  // Handle objects (CSS modules, styled-components)
  if (typeof className === 'object') {
    return Object.keys(className)
      .filter(key => className[key])
      .join(' ');
  }
  
  // Handle functions, numbers, booleans
  if (typeof className === 'function') {
    return '';
  }
  
  return String(className);
}

/**
 * Enhanced cn function that safely handles all className types
 * This prevents the "className.includes is not a function" error
 */
export function cn(...inputs: ClassValue[]): string {
  // First, make all inputs safe
  const safeInputs = inputs.map(input => {
    if (typeof input === 'string' || typeof input === 'undefined' || input === null) {
      return input;
    }
    return safeClassName(input);
  });
  
  return twMerge(clsx(safeInputs));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

// Format a date to a readable string
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate a random color from a string (for language/tag colors)
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
}
