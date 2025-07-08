/**
 * Soft Neumorphic Learning App Design System
 * Version: 1.0
 * 
 * A design system characterized by soft textures, high contrast, rounded shapes,
 * and neumorphic/glassmorphic card elements. The style is friendly, engaging, and modern.
 */

export const theme = {
  palette: {
    background: {
      primary: "#FDF8F3", // Primary light, warm, off-white background for all screens
    },
    text: {
      primary: "#1D1C2E", // Primary text color for dark text on light backgrounds
      secondary: "#8A8A9D", // Secondary text color for subtitles, captions, and less important information
      onDark: "#FFFFFF", // Text color for use on dark or saturated backgrounds
      accent: "#59569D", // Accent text color, often used for highlighting active states or stats
    },
    cards: {
      darkPurple: "#2C2B4B", // Primary dark card background, used for featured or promo elements
      lightPurple: "#D7D6F4", // A light, muted purple for secondary cards or elements
      lightOrange: "#FEE7D4", // A light, warm orange for course category cards or backgrounds
      lightBlue: "#D6E6FE", // A light, cool blue for secondary course category cards
      white: "#FFFFFF", // Standard white card background, used for primary content areas like charts
    },
    accents: {
      primary: "#59569D", // A deep purple used for icons, highlights, and active states
      secondary: "#FFAF74", // A soft orange used for progress bars, icons, and highlights
      neutral: "#E0E0E5", // A neutral gray for inactive states, borders, and dividers
    }
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    baseSize: "16px",
    styles: {
      display: {
        fontWeight: "700",
        fontSize: "2.5rem",
      },
      header_xl: {
        fontWeight: "600",
        fontSize: "1.5rem",
      },
      header_lg: {
        fontWeight: "700",
        fontSize: "1.25rem",
      },
      header_md: {
        fontWeight: "600",
        fontSize: "1rem",
      },
      body: {
        fontWeight: "500",
        fontSize: "0.9rem",
      },
      caption: {
        fontWeight: "400",
        fontSize: "0.8rem",
      },
      button: {
        fontWeight: "600",
        fontSize: "0.85rem",
      }
    }
  },
  effects: {
    borderRadius: {
      small: "8px",
      medium: "16px",
      large: "24px",
      extra_large: "32px",
      pill: "9999px",
      circle: "50%",
    },
    shadows: {
      soft: "0px 10px 30px rgba(0, 0, 0, 0.07)", // A soft, diffuse shadow to lift cards off the background
      inset: "inset 0px 4px 10px rgba(0, 0, 0, 0.05)", // A subtle inner shadow to give a soft-pressed or 'claymorphic' effect
    },
    glassmorphism: {
      enabled: true,
      blur: "20px",
      saturation: "180%",
      color: "rgba(44, 43, 75, 0.5)",
      // CSS helper for glassmorphism effect
      css: "backdrop-filter: blur(20px); background-color: rgba(44, 43, 75, 0.5);"
    }
  },
  icons: {
    style: "line",
    strokeWidth: "2px",
    filled: false,
  },
  layout: {
    containerPadding: "24px",
    verticalGap: "20px",
    horizontalGap: "16px",
  }
};

// CSS helper functions for common styling patterns
export const cssHelpers = {
  // Neumorphic effect for raised elements
  neumorphicRaised: `
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    background-color: #FDF8F3;
    border-radius: 16px;
  `,
  
  // Neumorphic effect for pressed elements
  neumorphicPressed: `
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
    background-color: #FDF8F3;
    border-radius: 16px;
  `,
  
  // Glassmorphic effect for featured cards
  glassmorphic: `
    backdrop-filter: blur(20px);
    background-color: rgba(44, 43, 75, 0.8);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `,
  
  // Text button styling
  textButton: `
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 1.4;
    transition: all 0.3s ease;
  `,
  
  // Hover effects
  hoverLift: `
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
  `,
};

export const themeStyles = {
  // Tab styling without circular dependency
  tabActive: `
    background-color: #59569D;
    color: #FFFFFF;
    border-radius: 9999px;
    padding: 8px 16px;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 1.4;
    transition: all 0.3s ease;
  `,
  
  tabInactive: `
    background-color: transparent;
    color: #8A8A9D;
    border-radius: 9999px;
    padding: 8px 16px;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 1.4;
    transition: all 0.3s ease;
  `,
};

export default theme;
