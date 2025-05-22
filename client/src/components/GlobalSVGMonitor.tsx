// client/src/components/GlobalSVGMonitor.tsx
import { useEffect } from 'react';

export function GlobalSVGMonitor() {
  useEffect(() => {
    console.log('[GlobalSVGMonitor] Starting SVG className monitoring...');
    
    let totalFixed = 0;
    
    // Function to fix SVG className objects
    const fixSVGClassNames = () => {
      const svgElements = document.querySelectorAll('svg, svg *');
      let batchFixed = 0;
      
      svgElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.className && 
            typeof htmlEl.className === 'object' && 
            'baseVal' in htmlEl.className) {
          
          const newClassName = (htmlEl.className as any).baseVal || '';
          htmlEl.setAttribute('class', newClassName);
          batchFixed++;
          totalFixed++;
        }
      });
      
      if (batchFixed > 0) {
        console.log(`[GlobalSVGMonitor] Fixed ${batchFixed} SVG elements (total: ${totalFixed})`);
      }
      
      return batchFixed;
    };
    
    // Fix existing elements immediately
    const initialFixed = fixSVGClassNames();
    if (initialFixed > 0) {
      console.log(`[GlobalSVGMonitor] Initial fix: ${initialFixed} elements`);
    }
    
    // Set up mutation observer for new elements
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check if it's an SVG or contains SVGs
              if (element.tagName === 'SVG' || 
                  element.querySelector?.('svg') ||
                  element.classList?.contains('lucide')) {
                shouldFix = true;
              }
            }
          });
        }
      });
      
      if (shouldFix) {
        // Small delay to let React finish rendering
        setTimeout(fixSVGClassNames, 10);
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also run periodic checks to catch anything we missed
    const intervalId = setInterval(() => {
      fixSVGClassNames();
    }, 2000);
    
    console.log('[GlobalSVGMonitor] SVG monitoring active');
    
    // Cleanup function
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
      console.log(`[GlobalSVGMonitor] Stopped. Total fixed: ${totalFixed}`);
    };
  }, []);
  
  return null; // This component renders nothing
}
