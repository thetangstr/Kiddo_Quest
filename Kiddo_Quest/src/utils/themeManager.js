// Theme Manager for Kiddo Quest
// Handles theme selection, storage, and application for child profiles

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
  getOptimalTextColor,
  addFocusStyles,
  enhanceTouchTarget,
  respectReducedMotion
} from './accessibilityUtils';

// Available themes with accessibility metadata
export const THEMES = {
  DEFAULT: 'default',
  SPACE: 'space',
  UNDERWATER: 'underwater',
  JUNGLE: 'jungle',
  PRINCESS: 'princess',
  SUPERHERO: 'superhero',
  DINOSAUR: 'dinosaur',
  PIRATE: 'pirate',
};

// Theme configurations with color schemes and accessibility properties
export const THEME_CONFIGS = {
  [THEMES.DEFAULT]: {
    id: THEMES.DEFAULT,
    name: 'Default',
    colors: {
      primary: '#6366f1', // indigo-600
      secondary: '#8b5cf6', // violet-500
      accent: '#ec4899', // pink-500
      background: 'from-blue-100 via-purple-100 to-pink-100',
      cardBg: 'bg-white',
      text: 'text-gray-800',
    },
    icon: '🌈',
    description: 'The classic Kiddo Quest theme',
    accessibility: {
      contrastRatio: 7.1, // Excellent contrast (text on background)
      highContrast: true, // Supports high contrast mode
      reducedMotion: true, // Supports reduced motion preference
      largeText: true, // Supports larger text options
    },
  },
  [THEMES.SPACE]: {
    id: THEMES.SPACE,
    name: 'Space Explorer',
    colors: {
      primary: '#3b82f6', // blue-500
      secondary: '#6366f1', // indigo-600
      accent: '#8b5cf6', // violet-500
      background: 'from-slate-900 via-purple-900 to-slate-900',
      cardBg: 'bg-gray-800',
      text: 'text-white',
    },
    icon: '🚀',
    description: 'Explore the cosmos with this space theme',
    accessibility: {
      contrastRatio: 16.0, // Very high contrast (white on dark background)
      highContrast: true,
      reducedMotion: true,
      largeText: true,
    },
  },
  [THEMES.UNDERWATER]: {
    id: THEMES.UNDERWATER,
    name: 'Ocean Adventure',
    colors: {
      primary: '#0ea5e9', // sky-500
      secondary: '#06b6d4', // cyan-500
      accent: '#22d3ee', // cyan-400
      background: 'from-cyan-500 via-blue-500 to-blue-700',
      cardBg: 'bg-blue-50',
      text: 'text-blue-900',
    },
    icon: '🐠',
    description: 'Dive into an underwater adventure',
    accessibility: {
      contrastRatio: 8.5, // High contrast
      highContrast: true,
      reducedMotion: true,
      largeText: true,
    },
  },
  [THEMES.JUNGLE]: {
    id: THEMES.JUNGLE,
    name: 'Jungle Safari',
    colors: {
      primary: '#16a34a', // green-600
      secondary: '#65a30d', // lime-600
      accent: '#ca8a04', // yellow-600
      background: 'from-green-700 via-green-600 to-lime-500',
      cardBg: 'bg-green-50',
      text: 'text-green-900',
    },
    icon: '🦁',
    description: 'Embark on a wild jungle adventure',
    accessibility: {
      contrastRatio: 7.8, // Good contrast
      highContrast: true,
      reducedMotion: true,
      largeText: true,
    },
  },
  [THEMES.PRINCESS]: {
    id: THEMES.PRINCESS,
    name: 'Royal Palace',
    colors: {
      primary: '#d946ef', // fuchsia-500
      secondary: '#ec4899', // pink-500
      accent: '#f472b6', // pink-400
      background: 'from-pink-200 via-pink-300 to-purple-200',
      cardBg: 'bg-pink-50',
      text: 'text-purple-900',
    },
    icon: '👑',
    description: 'A royal theme fit for princes and princesses',
    accessibility: {
      contrastRatio: 6.2, // Good contrast
      highContrast: true,
      reducedMotion: true,
      largeText: true,
    },
  },
  [THEMES.SUPERHERO]: {
    id: THEMES.SUPERHERO,
    name: 'Superhero',
    colors: {
      primary: '#dc2626', // red-600
      secondary: '#2563eb', // blue-600
      accent: '#facc15', // yellow-400
      background: 'from-red-500 via-red-600 to-blue-600',
      cardBg: 'bg-gray-100',
      text: 'text-gray-900',
    },
    icon: '🦸',
    description: 'Become a superhero with this action-packed theme',
    accessibility: {
      contrastRatio: 5.8, // Good contrast
      highContrast: true,
      reducedMotion: true,
      largeText: true,
    },
  },
  [THEMES.DINOSAUR]: {
    id: THEMES.DINOSAUR,
    name: 'Dinosaur World',
    colors: {
      primary: '#65a30d', // lime-600
      secondary: '#92400e', // amber-800
      accent: '#4d7c0f', // lime-700
      background: 'from-lime-700 via-lime-500 to-yellow-500',
      cardBg: 'bg-amber-100',
      text: 'text-amber-900',
    },
    icon: '🦖',
    description: 'Travel back in time with dinosaurs',
    accessibility: {
      contrastRatio: 6.5, // Good contrast
      highContrast: true,
      reducedMotion: true,
      largeText: true,
    },
  },
  [THEMES.PIRATE]: {
    id: THEMES.PIRATE,
    name: 'Pirate Adventure',
    colors: {
      primary: '#064e3b', // teal-900
      secondary: '#1e3a8a', // blue-900
      accent: '#f59e0b', // amber-500
      background: 'from-blue-900 via-blue-800 to-cyan-700',
      cardBg: 'bg-amber-100',
      text: 'text-gray-900',
    },
    icon: '☠️',
    description: 'Sail the seven seas in search of treasure',
    accessibility: {
      contrastRatio: 9.2, // Excellent contrast
      highContrast: true,
      reducedMotion: true,
      largeText: true,
    },
  },
};

/**
 * Updates a child's theme preference in Firestore
 * @param {string} childId - The child profile ID
 * @param {string} themeId - The selected theme ID
 * @returns {Promise<boolean>} - Success status
 */
export const setChildTheme = async (childId, themeId) => {
  try {
    // Validate theme exists
    if (!THEME_CONFIGS[themeId]) {
      console.error(`Theme ${themeId} does not exist`);
      return false;
    }

    // Update the child profile in Firestore
    await updateDoc(doc(db, 'childProfiles', childId), {
      theme: themeId,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating child theme:', error);
    return false;
  }
};

/**
 * Get theme configuration by ID
 * @param {string} themeId - The theme ID to retrieve
 * @returns {object} - Theme configuration object
 */
export const getThemeById = (themeId) => {
  // Return requested theme or default if not found
  return THEME_CONFIGS[themeId] || THEME_CONFIGS[THEMES.DEFAULT];
};

/**
 * Apply theme styles to an element class list
 * @param {string} themeId - Theme ID to apply
 * @param {string} elementType - Type of element ('background', 'card', 'button', etc.)
 * @returns {string} - CSS classes for the element
 */
export const getThemeClasses = (themeId, elementType) => {
  const theme = getThemeById(themeId);
  
  switch (elementType) {
    case 'background':
      return `bg-gradient-to-b ${theme.colors.background}`;
    case 'card':
      return `${theme.colors.cardBg} ${theme.colors.text} shadow-md`;
    case 'button':
      return `bg-${theme.colors.primary} hover:bg-${theme.colors.secondary} text-white`;
    case 'accent':
      return `bg-${theme.colors.accent} text-white`;
    case 'text':
      return theme.colors.text;
    default:
      return '';
  }
};

/**
 * Get all available themes as an array
 * @returns {Array} - Array of theme objects
 */
export const getAllThemes = () => {
  return Object.values(THEME_CONFIGS);
};

// Get accessibility options for a theme
export const getThemeAccessibilityOptions = (themeId) => {
  const theme = getThemeById(themeId);
  if (!theme) return null;
  
  const { accessibility } = theme;
  
  return {
    // Apply optimal text color based on background
    textColor: getOptimalTextColor(theme.colors.background) || theme.colors.text,
    
    // Enhanced focus styles for accessibility
    focusStyles: (baseClass) => addFocusStyles(baseClass),
    
    // Enhanced touch targets for improved touch accessibility
    touchTarget: (baseClass) => enhanceTouchTarget(baseClass),
    
    // Support for reduced motion preferences
    animation: (animClass) => respectReducedMotion(animClass),
    
    // Get contrast information
    contrast: accessibility?.contrastRatio || 4.5,
    highContrast: accessibility?.highContrast || false,
    
    // Get text size support
    largeText: accessibility?.largeText || false,
    
    // Helper for ensuring text is readable on any background
    ensureReadableText: (bgColorClass) => {
      return getOptimalTextColor(bgColorClass);
    }
  };
};
