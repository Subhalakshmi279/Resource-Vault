import React from 'react';

interface PixelIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PixelHome: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 11 11" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Roof outline */}
    <rect x="5" y="0" width="1" height="1" fill="#000000"/>
    <rect x="4" y="1" width="3" height="1" fill="#000000"/>
    <rect x="3" y="2" width="1" height="1" fill="#000000"/>
    <rect x="7" y="2" width="1" height="1" fill="#000000"/>
    <rect x="2" y="3" width="1" height="1" fill="#000000"/>
    <rect x="8" y="3" width="1" height="1" fill="#000000"/>
    <rect x="1" y="4" width="1" height="1" fill="#000000"/>
    <rect x="9" y="4" width="1" height="1" fill="#000000"/>
    <rect x="0" y="5" width="11" height="1" fill="#000000"/>
    {/* Base outline */}
    <rect x="1" y="6" width="1" height="4" fill="#000000"/>
    <rect x="9" y="6" width="1" height="4" fill="#000000"/>
    <rect x="1" y="10" width="9" height="1" fill="#000000"/>
    {/* Door outline */}
    <rect x="4" y="7" width="3" height="3" fill="#000000"/>
    {/* Roof Fill */}
    <rect x="5" y="1" width="1" height="1" fill="#ff758f"/>
    <rect x="4" y="2" width="3" height="1" fill="#ff758f"/>
    <rect x="3" y="3" width="5" height="1" fill="#ff758f"/>
    <rect x="2" y="4" width="7" height="1" fill="#ff758f"/>
    {/* Body Fill */}
    <rect x="2" y="6" width="7" height="4" fill="#fdf0d5"/>
    {/* Door Fill */}
    <rect x="5" y="8" width="1" height="2" fill="#ffffff"/>
  </svg>
);

export const PixelSearch: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 11 11" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Outline & handle */}
    <rect x="2" y="0" width="4" height="1" fill="#000000"/>
    <rect x="1" y="1" width="1" height="1" fill="#000000"/>
    <rect x="6" y="1" width="1" height="1" fill="#000000"/>
    <rect x="0" y="2" width="1" height="4" fill="#000000"/>
    <rect x="7" y="2" width="1" height="4" fill="#000000"/>
    <rect x="1" y="6" width="1" height="1" fill="#000000"/>
    <rect x="6" y="6" width="1" height="1" fill="#000000"/>
    <rect x="2" y="7" width="4" height="1" fill="#000000"/>
    {/* Handle */}
    <rect x="6" y="7" width="1" height="1" fill="#000000"/>
    <rect x="7" y="8" width="1" height="1" fill="#000000"/>
    <rect x="8" y="9" width="1" height="1" fill="#000000"/>
    <rect x="9" y="10" width="1" height="1" fill="#000000"/>
    <rect x="10" y="10" width="1" height="1" fill="#000000"/>
    {/* Lens Fill */}
    <rect x="2" y="1" width="4" height="1" fill="#61b1a7"/>
    <rect x="1" y="2" width="6" height="4" fill="#61b1a7"/>
    <rect x="2" y="6" width="4" height="1" fill="#61b1a7"/>
    {/* Highlight */}
    <rect x="2" y="2" width="2" height="1" fill="#ffffff"/>
    <rect x="2" y="3" width="1" height="1" fill="#ffffff"/>
  </svg>
);

export const PixelStar: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 9 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Outline */}
    <rect x="4" y="0" width="1" height="1" fill="#000000"/>
    <rect x="3" y="1" width="1" height="1" fill="#000000"/>
    <rect x="5" y="1" width="1" height="1" fill="#000000"/>
    <rect x="2" y="2" width="1" height="1" fill="#000000"/>
    <rect x="6" y="2" width="1" height="1" fill="#000000"/>
    <rect x="1" y="3" width="1" height="1" fill="#000000"/>
    <rect x="7" y="3" width="1" height="1" fill="#000000"/>
    <rect x="0" y="4" width="1" height="1" fill="#000000"/>
    <rect x="8" y="4" width="1" height="1" fill="#000000"/>
    <rect x="1" y="5" width="1" height="1" fill="#000000"/>
    <rect x="7" y="5" width="1" height="1" fill="#000000"/>
    <rect x="2" y="6" width="1" height="1" fill="#000000"/>
    <rect x="6" y="6" width="1" height="1" fill="#000000"/>
    <rect x="3" y="7" width="1" height="1" fill="#000000"/>
    <rect x="5" y="7" width="1" height="1" fill="#000000"/>
    <rect x="4" y="8" width="1" height="1" fill="#000000"/>
    {/* Fill */}
    <rect x="4" y="1" width="1" height="1" fill="#ffd166"/>
    <rect x="3" y="2" width="3" height="1" fill="#ffd166"/>
    <rect x="2" y="3" width="5" height="1" fill="#ffd166"/>
    <rect x="1" y="4" width="7" height="1" fill="#ffd166"/>
    <rect x="2" y="5" width="5" height="1" fill="#ffd166"/>
    <rect x="3" y="6" width="3" height="1" fill="#ffd166"/>
    <rect x="4" y="7" width="1" height="1" fill="#ffd166"/>
    {/* Highlight */}
    <rect x="4" y="3" width="1" height="2" fill="#ffffff"/>
    <rect x="3" y="4" width="3" height="1" fill="#ffffff"/>
  </svg>
);

export const PixelHeart: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 11 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Black outline */}
    <rect x="2" y="0" width="2" height="1" fill="#000000"/>
    <rect x="7" y="0" width="2" height="1" fill="#000000"/>
    <rect x="1" y="1" width="1" height="1" fill="#000000"/>
    <rect x="4" y="1" width="1" height="1" fill="#000000"/>
    <rect x="6" y="1" width="1" height="1" fill="#000000"/>
    <rect x="9" y="1" width="1" height="1" fill="#000000"/>
    <rect x="0" y="2" width="1" height="3" fill="#000000"/>
    <rect x="10" y="2" width="1" height="3" fill="#000000"/>
    <rect x="1" y="5" width="1" height="1" fill="#000000"/>
    <rect x="9" y="5" width="1" height="1" fill="#000000"/>
    <rect x="2" y="6" width="1" height="1" fill="#000000"/>
    <rect x="8" y="6" width="1" height="1" fill="#000000"/>
    <rect x="3" y="7" width="1" height="1" fill="#000000"/>
    <rect x="7" y="7" width="1" height="1" fill="#000000"/>
    <rect x="4" y="8" width="3" height="1" fill="#000000"/>
    {/* Fill */}
    <rect x="2" y="1" width="2" height="1" fill="#ff4d6d"/>
    <rect x="7" y="1" width="2" height="1" fill="#ff4d6d"/>
    <rect x="1" y="2" width="8" height="1" fill="#ff4d6d"/>
    <rect x="1" y="3" width="8" height="1" fill="#ff4d6d"/>
    <rect x="1" y="4" width="8" height="1" fill="#ff4d6d"/>
    <rect x="2" y="5" width="6" height="1" fill="#ff4d6d"/>
    <rect x="3" y="6" width="4" height="1" fill="#ff4d6d"/>
    <rect x="4" y="7" width="2" height="1" fill="#ff4d6d"/>
    {/* Highlight */}
    <rect x="2" y="2" width="1" height="2" fill="#ffffff"/>
    <rect x="3" y="2" width="1" height="1" fill="#ffffff"/>
  </svg>
);

export const PixelBriefcase: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 11 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Handle */}
    <rect x="4" y="0" width="3" height="1" fill="#000000"/>
    <rect x="3" y="1" width="1" height="1" fill="#000000"/>
    <rect x="7" y="1" width="1" height="1" fill="#000000"/>
    {/* Body outline */}
    <rect x="1" y="2" width="9" height="1" fill="#000000"/>
    <rect x="0" y="3" width="1" height="5" fill="#000000"/>
    <rect x="10" y="3" width="1" height="5" fill="#000000"/>
    <rect x="1" y="8" width="9" height="1" fill="#000000"/>
    {/* Latch */}
    <rect x="5" y="5" width="1" height="1" fill="#000000"/>
    {/* Body Fill */}
    <rect x="1" y="3" width="9" height="5" fill="#c4b5fd"/>
    <rect x="4" y="0" width="3" height="1" fill="#c4b5fd"/>
    {/* Highlights */}
    <rect x="1" y="3" width="8" height="1" fill="#ffffff"/>
    <rect x="5" y="5" width="1" height="1" fill="#ffd166"/>
  </svg>
);

export const PixelLaptop: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 11 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Screen frame */}
    <rect x="1" y="0" width="9" height="1" fill="#000000"/>
    <rect x="0" y="1" width="1" height="5" fill="#000000"/>
    <rect x="10" y="1" width="1" height="5" fill="#000000"/>
    <rect x="1" y="6" width="9" height="1" fill="#000000"/>
    {/* Stand & Base */}
    <rect x="4" y="7" width="3" height="1" fill="#000000"/>
    <rect x="2" y="8" width="7" height="1" fill="#000000"/>
    {/* Fill screen border */}
    <rect x="1" y="1" width="8" height="5" fill="#e2e8f0"/>
    {/* Inner screen */}
    <rect x="2" y="2" width="6" height="3" fill="#a2d2ff"/>
    {/* Stand fill */}
    <rect x="5" y="7" width="1" height="1" fill="#94a3b8"/>
  </svg>
);

export const PixelBookmark: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 9 11" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Outline */}
    <rect x="0" y="0" width="7" height="1" fill="#000000"/>
    <rect x="0" y="1" width="1" height="9" fill="#000000"/>
    <rect x="8" y="2" width="1" height="8" fill="#000000"/>
    <rect x="0" y="10" width="9" height="1" fill="#000000"/>
    {/* Dog-ear fold outline */}
    <rect x="6" y="1" width="2" height="1" fill="#000000"/>
    <rect x="6" y="2" width="1" height="1" fill="#000000"/>
    {/* Body fill */}
    <rect x="1" y="1" width="5" height="9" fill="#faf2e3"/>
    <rect x="6" y="3" width="2" height="7" fill="#faf2e3"/>
    {/* Exclamation mark inside document */}
    <rect x="4" y="3" width="1" height="4" fill="#ef233c"/>
    <rect x="4" y="8" width="1" height="1" fill="#ef233c"/>
  </svg>
);

export const PixelAlert: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 11 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Outline */}
    <rect x="5" y="0" width="1" height="1" fill="#000000"/>
    <rect x="4" y="1" width="1" height="1" fill="#000000"/>
    <rect x="6" y="1" width="1" height="1" fill="#000000"/>
    <rect x="3" y="2" width="1" height="1" fill="#000000"/>
    <rect x="7" y="2" width="1" height="1" fill="#000000"/>
    <rect x="2" y="3" width="1" height="1" fill="#000000"/>
    <rect x="8" y="3" width="1" height="1" fill="#000000"/>
    <rect x="1" y="4" width="1" height="1" fill="#000000"/>
    <rect x="9" y="4" width="1" height="1" fill="#000000"/>
    <rect x="0" y="5" width="1" height="3" fill="#000000"/>
    <rect x="10" y="5" width="1" height="3" fill="#000000"/>
    <rect x="1" y="8" width="9" height="1" fill="#000000"/>
    {/* Fill */}
    <rect x="5" y="1" width="1" height="1" fill="#ffd166"/>
    <rect x="4" y="2" width="3" height="1" fill="#ffd166"/>
    <rect x="3" y="3" width="5" height="1" fill="#ffd166"/>
    <rect x="2" y="4" width="7" height="1" fill="#ffd166"/>
    <rect x="1" y="5" width="9" height="3" fill="#ffd166"/>
    {/* Exclamation mark inside warning */}
    <rect x="5" y="3" width="1" height="3" fill="#000000"/>
    <rect x="5" y="7" width="1" height="1" fill="#000000"/>
  </svg>
);

export const PixelFolder: React.FC<PixelIconProps> = ({ size = 18, className, style }) => (
  <svg 
    viewBox="0 0 11 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    {/* Folder Outline */}
    <rect x="1" y="1" width="3" height="1" fill="#352219"/>
    <rect x="4" y="2" width="6" height="1" fill="#352219"/>
    <rect x="0" y="2" width="1" height="6" fill="#352219"/>
    <rect x="10" y="3" width="1" height="5" fill="#352219"/>
    <rect x="1" y="8" width="9" height="1" fill="#352219"/>
    {/* Fill */}
    <rect x="1" y="2" width="3" height="1" fill="#ffd166"/>
    <rect x="1" y="3" width="9" height="5" fill="#ffd166"/>
    <rect x="1" y="4" width="8" height="1" fill="#ffebc2"/>
  </svg>
);

export const PixelPlus: React.FC<PixelIconProps> = ({ size = 14, className, style }) => (
  <svg 
    viewBox="0 0 9 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    <rect x="4" y="1" width="1" height="7" fill="currentColor"/>
    <rect x="1" y="4" width="7" height="1" fill="currentColor"/>
  </svg>
);

export const PixelClose: React.FC<PixelIconProps> = ({ size = 12, className, style }) => (
  <svg 
    viewBox="0 0 9 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    <rect x="1" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="7" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="2" y="2" width="1" height="1" fill="currentColor"/>
    <rect x="6" y="2" width="1" height="1" fill="currentColor"/>
    <rect x="3" y="3" width="3" height="3" fill="currentColor"/>
    <rect x="2" y="6" width="1" height="1" fill="currentColor"/>
    <rect x="6" y="6" width="1" height="1" fill="currentColor"/>
    <rect x="1" y="7" width="1" height="1" fill="currentColor"/>
    <rect x="7" y="7" width="1" height="1" fill="currentColor"/>
  </svg>
);

export const PixelArrow: React.FC<PixelIconProps> = ({ size = 12, className, style }) => (
  <svg 
    viewBox="0 0 9 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    <rect x="4" y="1" width="1" height="1" fill="currentColor"/>
    <rect x="3" y="2" width="2" height="1" fill="currentColor"/>
    <rect x="2" y="3" width="3" height="1" fill="currentColor"/>
    <rect x="1" y="4" width="7" height="1" fill="currentColor"/>
    <rect x="2" y="5" width="3" height="1" fill="currentColor"/>
    <rect x="3" y="6" width="2" height="1" fill="currentColor"/>
    <rect x="4" y="7" width="1" height="1" fill="currentColor"/>
  </svg>
);

export const PixelLink: React.FC<PixelIconProps> = ({ size = 12, className, style }) => (
  <svg 
    viewBox="0 0 9 9" 
    width={size} 
    height={size} 
    className={className}
    style={{ imageRendering: 'pixelated', flexShrink: 0, ...style }}
  >
    <rect x="4" y="1" width="4" height="1" fill="currentColor"/>
    <rect x="7" y="2" width="1" height="3" fill="currentColor"/>
    <rect x="5" y="3" width="1" height="1" fill="currentColor"/>
    <rect x="4" y="4" width="1" height="1" fill="currentColor"/>
    <rect x="3" y="5" width="1" height="1" fill="currentColor"/>
    <rect x="1" y="4" width="1" height="4" fill="currentColor"/>
    <rect x="2" y="7" width="3" height="1" fill="currentColor"/>
  </svg>
);
