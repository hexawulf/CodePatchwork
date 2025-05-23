// CREATE THIS FILE: client/src/lib/safe-classname.ts

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
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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

// Export the original cn as well for backwards compatibility
export { clsx, twMerge };
