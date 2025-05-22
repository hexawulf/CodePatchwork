// CREATE THIS FILE: client/src/components/FixedLucideIcon.tsx
import React, { useEffect, useRef } from 'react';
import { LucideProps } from 'lucide-react';

/**
 * Wrapper component that fixes Lucide React SVG className issues
 * Use this instead of importing Lucide icons directly
 */
export function FixedLucideIcon({ 
  children, 
  className, 
  ...props 
}: { 
  children: React.ReactElement,
  className?: string 
} & LucideProps) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      // Fix the SVG and all its children
      const svgElements = ref.current.querySelectorAll('svg, svg *');
      svgElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.className && typeof htmlEl.className === 'object' && 'baseVal' in htmlEl.className) {
          const newClassName = (htmlEl.className as any).baseVal || '';
          htmlEl.setAttribute('class', newClassName);
        }
      });
    }
  });
  
  // Clone the child element and add our ref
  const childWithRef = React.cloneElement(children, {
    ref,
    className: className || children.props.className,
    ...props
  });
  
  return childWithRef;
}

// Alternative: Create a hook for existing components
export function useLucideIconFix() {
  useEffect(() => {
    const fixSVGs = () => {
      const svgElements = document.querySelectorAll('svg.lucide, svg[class*="lucide"]');
      svgElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.className && typeof htmlEl.className === 'object' && 'baseVal' in htmlEl.className) {
          const newClassName = (htmlEl.className as any).baseVal || '';
          htmlEl.setAttribute('class', newClassName);
        }
        
        // Also fix children
        const children = htmlEl.querySelectorAll('*');
        children.forEach((child: Element) => {
          const childEl = child as HTMLElement;
          if (childEl.className && typeof childEl.className === 'object' && 'baseVal' in childEl.className) {
            const newClassName = (childEl.className as any).baseVal || '';
            childEl.setAttribute('class', newClassName);
          }
        });
      });
    };
    
    // Fix immediately
    fixSVGs();
    
    // Fix after any potential re-renders
    const timeoutId = setTimeout(fixSVGs, 100);
    
    return () => clearTimeout(timeoutId);
  });
}
