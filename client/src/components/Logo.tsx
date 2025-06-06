// src/components/Logo.tsx
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const CodePatchworkLogo: React.FC<LogoProps> = ({ 
  size = 32, 
  className = "" 
}) => {
  return (
    <svg 
      viewBox="0 0 256 256" 
      xmlns="http://www.w3.org/2000/svg" 
      role="img" 
      aria-label="CodePatchwork Icon Logo"
      width={size}
      height={size}
      className={className}
    >
      <style>
        {`
          .bg { fill: hsl(207, 90%, 54%); }
          .stitch { stroke: hsl(240, 3.7%, 15.9%); stroke-width: 2; stroke-dasharray: 6, 6; fill: none; }
          .symbol { fill: hsl(0, 0%, 98%); font-family: 'Courier New', monospace; font-weight: bold; font-size: 24px; dominant-baseline: middle; text-anchor: middle; }
        `}
      </style>
      <rect className="bg" width="256" height="256" rx="16" ry="16"/>
      <line className="stitch" x1="85.3" y1="0" x2="85.3" y2="256"/>
      <line className="stitch" x1="170.6" y1="0" x2="170.6" y2="256"/>
      <line className="stitch" x1="0" y1="85.3" x2="256" y2="85.3"/>
      <line className="stitch" x1="0" y1="170.6" x2="256" y2="170.6"/>
      <text className="symbol" x="42.6" y="42.6">{"{}"}</text>
      <text className="symbol" x="128" y="42.6">{"<>"}</text>
      <text className="symbol" x="213.3" y="42.6">//</text>
      <text className="symbol" x="42.6" y="128">[]</text>
      <text className="symbol" x="128" y="128">JS</text>
      <text className="symbol" x="213.3" y="128">PY</text>
      <text className="symbol" x="42.6" y="213.3">01</text>
      <text className="symbol" x="128" y="213.3">.PY</text>
      <text className="symbol" x="213.3" y="213.3">{"⎇"}</text>
    </svg>
  );
};
