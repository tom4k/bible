import React from 'react';

/**
 * Saint Thomas Cross (Mar Thoma Sleeva)
 * Sacred emblem of the Syro-Malabar Catholic Church and Saint Thomas Christians of Kerala.
 * Characterized by petal ends on the arms and a lotus base symbolizing the Resurrection.
 */
export function SyroCrossIcon({
  className = 'w-6 h-6',
  color = 'currentColor',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Saint Thomas Cross"
    >
      {/* Central Cross Vertical Shaft */}
      <line x1="50" y1="18" x2="50" y2="76" />
      {/* Central Cross Horizontal Beam */}
      <line x1="26" y1="42" x2="74" y2="42" />

      {/* Top Arm Leaves/Clover tips */}
      <circle cx="50" cy="14" r="3.5" fill={color} />
      <circle cx="45" cy="16" r="2.5" fill={color} />
      <circle cx="55" cy="16" r="2.5" fill={color} />

      {/* Left Arm Leaves/Clover tips */}
      <circle cx="22" cy="42" r="3.5" fill={color} />
      <circle cx="24" cy="37" r="2.5" fill={color} />
      <circle cx="24" cy="47" r="2.5" fill={color} />

      {/* Right Arm Leaves/Clover tips */}
      <circle cx="78" cy="42" r="3.5" fill={color} />
      <circle cx="76" cy="37" r="2.5" fill={color} />
      <circle cx="76" cy="47" r="2.5" fill={color} />

      {/* Dove / Holy Spirit symbol above top beam */}
      <path
        d="M 44 26 Q 50 20 56 26"
        fill="none"
        stroke={color}
        strokeWidth="3"
      />

      {/* Base Lotus Petals (Calvary / Lotus pedestal) */}
      <path
        d="M 32 76 Q 50 86 68 76"
        fill="none"
        stroke={color}
        strokeWidth="4"
      />
      <path
        d="M 24 82 Q 50 94 76 82"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
      />
      {/* Pedestal steps */}
      <line x1="28" y1="92" x2="72" y2="92" strokeWidth="4" />
      <line x1="20" y1="96" x2="80" y2="96" strokeWidth="4" />
    </svg>
  );
}
