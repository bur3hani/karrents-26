import React from 'react';

interface KarrentsLogoProps {
  className?: string;
  glow?: boolean;
}

export default function KarrentsLogo({ className = "w-6 h-6", glow = false }: KarrentsLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${glow ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.35)]' : ''}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Symmetric geometric owl head & body */}
        <path
          d="M50 15 L25 25 L20 40 L35 50 L50 40 L65 50 L80 40 L75 25 Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Forehead V & Diamond */}
        <path
          d="M50 15 L50 28 L40 20 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M50 15 L50 28 L60 20 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Ears */}
        <path
          d="M25 25 L35 12 L40 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M75 25 L65 12 L60 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Left Eye Hexagon & Pupil */}
        <path
          d="M25 35 L33 28 L43 31 L43 40 L35 43 L27 40 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="35" cy="35" r="3" fill="currentColor" />
        
        {/* Right Eye Hexagon & Pupil */}
        <path
          d="M75 35 L67 28 L57 31 L57 40 L65 43 L73 40 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="65" cy="35" r="3" fill="currentColor" />

        {/* Beak */}
        <path
          d="M46 38 L54 38 L50 48 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Outer Wings/Shoulders */}
        <path
          d="M20 40 L15 65 L28 85 L38 65 L35 50 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M80 40 L85 65 L72 85 L62 65 L65 50 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Chest Plate Diamonds / Triangles */}
        <path
          d="M50 48 L38 65 L50 78 L62 65 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M50 48 L50 78"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M44 56 L56 56"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M41 62 L59 62"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Tail feathers */}
        <path
          d="M42 78 L50 92 L58 78 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
