// Accessibility utilities for Kiddo Quest
// Provides utilities for ensuring themes are accessible

/**
 * Calculate contrast ratio between two hex colors
 * @param {string} color1 - First hex color (with or without #)
 * @param {string} color2 - Second hex color (with or without #)
 * @returns {number} - Contrast ratio between the two colors
 */
export const calculateContrastRatio = (color1, color2) => {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Calculate relative luminance of a color (WCAG formula)
 * @param {string} hexColor - Hex color (with or without #)
 * @returns {number} - Luminance value between 0 and 1
 */
export const calculateLuminance = (hexColor) => {
  // Remove # if present
  const hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  
  // Convert hex to rgb
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Calculate luminance
  const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Check if a color combination meets WCAG AA standard (4.5:1 for normal text)
 * @param {string} foreground - Foreground color in hex
 * @param {string} background - Background color in hex
 * @returns {boolean} - True if meets WCAG AA standard
 */
export const meetsWCAGAA = (foreground, background) => {
  return calculateContrastRatio(foreground, background) >= 4.5;
};

/**
 * Convert tailwind color class to hex color
 * @param {string} colorClass - Tailwind color class (e.g., 'text-blue-500')
 * @returns {string} - Hex color code or null if not found
 */
export const tailwindColorToHex = (colorClass) => {
  // Extract color and shade from Tailwind class
  const match = colorClass.match(/(bg|text|border|from|via|to)-([a-z]+-[0-9]+)/);
  if (!match) return null;
  
  const [, , colorWithShade] = match;
  const [color, shade] = colorWithShade.split('-');
  
  // Common Tailwind colors with their hex values
  const tailwindColors = {
    slate: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 
      400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
      800: '#1e293b', 900: '#0f172a'
    },
    gray: {
      50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 
      400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
      800: '#1f2937', 900: '#111827'
    },
    red: {
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 
      400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
      800: '#991b1b', 900: '#7f1d1d'
    },
    orange: {
      50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 
      400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
      800: '#9a3412', 900: '#7c2d12'
    },
    amber: {
      50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 
      400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
      800: '#92400e', 900: '#78350f'
    },
    yellow: {
      50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 
      400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
      800: '#854d0e', 900: '#713f12'
    },
    lime: {
      50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 
      400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f',
      800: '#3f6212', 900: '#365314'
    },
    green: {
      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 
      400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
      800: '#166534', 900: '#14532d'
    },
    emerald: {
      50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 
      400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
      800: '#065f46', 900: '#064e3b'
    },
    teal: {
      50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 
      400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
      800: '#115e59', 900: '#134e4a'
    },
    cyan: {
      50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 
      400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490',
      800: '#155e75', 900: '#164e63'
    },
    sky: {
      50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 
      400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
      800: '#075985', 900: '#0c4a6e'
    },
    blue: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 
      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
      800: '#1e40af', 900: '#1e3a8a'
    },
    indigo: {
      50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 
      400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
      800: '#3730a3', 900: '#312e81'
    },
    violet: {
      50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 
      400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
      800: '#5b21b6', 900: '#4c1d95'
    },
    purple: {
      50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 
      400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
      800: '#6b21a8', 900: '#581c87'
    },
    fuchsia: {
      50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 
      400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf',
      800: '#86198f', 900: '#701a75'
    },
    pink: {
      50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 
      400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
      800: '#9d174d', 900: '#831843'
    },
    rose: {
      50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 
      400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
      800: '#9f1239', 900: '#881337'
    },
    white: '#ffffff',
    black: '#000000'
  };
  
  if (tailwindColors[color] && tailwindColors[color][shade]) {
    return tailwindColors[color][shade];
  } else if (tailwindColors[color]) {
    return tailwindColors[color];
  }
  
  return null;
};

/**
 * Get enhanced readable text color based on background
 * @param {string} bgColor - Background color in hex or Tailwind class
 * @returns {string} - Text color Tailwind class for optimal contrast
 */
export const getOptimalTextColor = (bgColor) => {
  const hexColor = bgColor.startsWith('#') ? 
    bgColor : 
    tailwindColorToHex(bgColor) || '#ffffff';
  
  const luminance = calculateLuminance(hexColor);
  
  // Use black text on light backgrounds, white text on dark backgrounds
  return luminance > 0.55 ? 'text-gray-900' : 'text-white';
};

/**
 * Create larger touch targets for interactive elements 
 * @param {string} baseClass - Base class string
 * @returns {string} - Enhanced class string with larger touch targets
 */
export const enhanceTouchTarget = (baseClass) => {
  return `${baseClass} min-h-[44px] min-w-[44px] md:min-h-[44px] md:min-w-[44px]`;
};

/**
 * Add focus styles for keyboard navigation
 * @param {string} baseClass - Base class string
 * @returns {string} - Enhanced class string with focus styles
 */
export const addFocusStyles = (baseClass) => {
  return `${baseClass} focus:ring-4 focus:outline-none focus-visible:ring-offset-2`;
};

/**
 * Add reduced motion option to animation
 * @param {string} animationClass - Animation class
 * @returns {string} - Animation class with reduced motion preference support
 */
export const respectReducedMotion = (animationClass) => {
  return `${animationClass} motion-reduce:transform-none motion-reduce:transition-none`;
};
