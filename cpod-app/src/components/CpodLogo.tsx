import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface CpodLogoProps {
  size?: number;
  /** 'full' = logo completo (container+blocos), 'icon' = somente o bloco maior */
  variant?: 'full' | 'icon';
}

/**
 * Logo cPod em SVG nativo — fiel ao cpod.svg original.
 * Proporção original: 512 × 256 → aspect 2:1
 */
export default function CpodLogo({ size = 120, variant = 'full' }: CpodLogoProps) {
  if (variant === 'icon') {
    // Somente o bloco teal (canto superior direito do logo)
    return (
      <Svg width={size} height={size} viewBox="0 0 70 70">
        <Rect x="0" y="0" width="70" height="70" rx="16" fill="#1F5C59" />
      </Svg>
    );
  }

  const height = size / 2;
  return (
    <Svg width={size} height={height} viewBox="0 0 512 256">
      {/* Container com abertura (C) */}
      <Path
        d="M96 32 H392 M456 152 V160 A64 64 0 0 1 392 224 H96 A64 64 0 0 1 32 160 V96 A64 64 0 0 1 96 32"
        fill="none"
        stroke="#1F5C59"
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bloco roxo */}
      <Rect x="100" y="88" width="80" height="80" rx="18" fill="#C333F3" />
      {/* Bloco cyan */}
      <Rect x="220" y="124" width="64" height="64" rx="16" fill="#33C3F3" />
      {/* Bloco mint */}
      <Rect x="330" y="100" width="56" height="56" rx="14" fill="#33F3C3" />
      {/* Bloco teal */}
      <Rect x="410" y="50" width="70" height="70" rx="16" fill="#1F5C59" />
    </Svg>
  );
}
