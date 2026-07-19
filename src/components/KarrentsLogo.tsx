import React from 'react';

interface KarrentsLogoProps {
  className?: string;
  glow?: boolean;
}

export default function KarrentsLogo({ className = "w-6 h-6", glow = false }: KarrentsLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${glow ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.35)]' : ''}`}>
      <img
        src="/logo.png"
        alt="Karrents Logo"
        className={`${className} object-contain`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
