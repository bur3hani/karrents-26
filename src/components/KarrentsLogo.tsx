import React from 'react';

interface KarrentsLogoProps {
  className?: string;
  glow?: boolean;
}

export default function KarrentsLogo({ className = "w-6 h-6 text-brand-neon", glow = false }: KarrentsLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${glow ? 'drop-shadow-[0_0_12px_rgba(238,5,242,0.45)]' : ''}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${className} transition-all duration-300 hover:scale-105`}
      >
        {/* Left Ear & Crown */}
        <polygon points="50,22 35,12 30,22 37,28" />
        {/* Right Ear & Crown */}
        <polygon points="50,22 65,12 70,22 63,28" />
        
        {/* Top Head Polyline */}
        <polygon points="50,22 45,17 50,15 55,17" />
        
        {/* Forehead Connection */}
        <polygon points="50,22 37,28 29,35 37,35" />
        <polygon points="50,22 63,28 71,35 63,35" />
        
        {/* Brow V-shape */}
        <polygon points="50,33 37,28 43,35" />
        <polygon points="50,33 63,28 57,35" />
        
        {/* Eyes (Hexagonal Geometric Eyes matching the image) */}
        {/* Left Eye */}
        <polygon points="43,32 37,35 37,42 43,45 49,42 49,35" />
        <circle cx="43" cy="38" r="2.5" fill="currentColor" className="text-brand-neon" />
        {/* Right Eye */}
        <polygon points="57,32 51,35 51,42 57,45 63,42 63,35" />
        <circle cx="57" cy="38" r="2.5" fill="currentColor" className="text-brand-neon" />
        
        {/* Beak */}
        <polygon points="49,42 51,42 50,52" fill="currentColor" className="text-brand-red text-opacity-80" />
        
        {/* Cheeks */}
        <polygon points="37,42 29,35 27,48 37,48" />
        <polygon points="63,42 71,35 73,48 63,48" />
        
        {/* Throat */}
        <polygon points="37,48 50,52 40,58" />
        <polygon points="63,48 50,52 60,58" />
        
        {/* Mid Chest V */}
        <polygon points="50,52 40,58 50,68" />
        <polygon points="50,52 60,58 50,68" />
        
        {/* Upper Body Flanks */}
        <polygon points="37,48 27,48 29,62 40,58" />
        <polygon points="63,48 73,48 71,62 60,58" />
        
        {/* Mid Body Grid */}
        <polygon points="40,58 50,68 40,75 30,70 29,62" />
        <polygon points="60,58 50,68 60,75 70,70 71,62" />
        
        {/* Lower Chest */}
        <polygon points="50,68 40,75 50,82" />
        <polygon points="50,68 60,75 50,82" />
        
        {/* Bottom Wings / Feathers */}
        <polygon points="30,70 40,75 38,88 29,80" />
        <polygon points="70,70 60,75 62,88 71,80" />
        
        {/* Base Tail */}
        <polygon points="40,75 50,82 48,94 38,88" />
        <polygon points="60,75 50,82 52,94 62,88" />
        <polygon points="50,82 48,94 50,96 52,94" />
      </svg>
    </div>
  );
}
