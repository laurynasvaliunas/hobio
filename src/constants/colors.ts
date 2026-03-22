/**
 * Hobio Brand Colors — Full light + dark theme support.
 *
 * Primary: #D97758 (Terracotta / warm coral — the Hobio brand colour)
 * Light:   Warm cream backgrounds, sage accents, amber highlights
 * Dark:    Deep espresso base with softened terracotta and sage tones
 */

export interface ThemeColors {
  primary: { DEFAULT: string; light: string; dark: string };
  secondary: { DEFAULT: string; light: string; dark: string };
  accent: { DEFAULT: string; light: string; dark: string };
  warning: { DEFAULT: string; dark: string };
  danger: { DEFAULT: string; dark: string };
  background: string;
  surface: string;
  surfaceElevated: string;
  text: { primary: string; secondary: string; inverse: string };
  border: string;
}

export interface ThemeShadows {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  button: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  tabBar: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

// ── Light Theme ──
export const LightColors: ThemeColors = {
  primary: {
    DEFAULT: "#D97758",   // Hobio Terracotta
    light: "#EDA085",     // Soft coral
    dark: "#B85A3A",      // Deep terracotta
  },
  secondary: {
    DEFAULT: "#7AAF8A",   // Sage green (earthy complement)
    light: "#9ECBAD",
    dark: "#5A8A6A",
  },
  accent: {
    DEFAULT: "#E8B86D",   // Warm amber / sand
    light: "#F2CF99",
    dark: "#C9941F",
  },
  warning: {
    DEFAULT: "#F0BE4A",
    dark: "#D4A020",
  },
  danger: {
    DEFAULT: "#D45B5B",
    dark: "#B03030",
  },
  background: "#FBF6F3",        // Warm cream — very subtle terracotta tint
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  text: {
    primary: "#2D1E17",         // Very dark warm brown — excellent contrast
    secondary: "#7A6158",       // Warm medium brown
    inverse: "#FFFFFF",
  },
  border: "#EBE0D9",            // Warm light border
};

// ── Dark Theme ("Night Camp") ──
export const DarkColors: ThemeColors = {
  primary: {
    DEFAULT: "#E8907A",   // Lighter terracotta for dark backgrounds
    light: "#F0AE9C",
    dark: "#C97060",
  },
  secondary: {
    DEFAULT: "#9ECBAD",   // Lighter sage
    light: "#B8DEC6",
    dark: "#7AAF8A",
  },
  accent: {
    DEFAULT: "#F2CF99",   // Lighter amber
    light: "#F5DEBA",
    dark: "#E8B86D",
  },
  warning: {
    DEFAULT: "#F5D485",
    dark: "#E8C050",
  },
  danger: {
    DEFAULT: "#E89090",   // Softer red
    dark: "#D45B5B",
  },
  background: "#1A110D",        // Deep espresso — warm dark
  surface: "#261610",           // Elevated surface
  surfaceElevated: "#32201A",   // Cards on dark
  text: {
    primary: "#F0E8E3",
    secondary: "#A08880",
    inverse: "#1A110D",
  },
  border: "#3D2820",
};

export const LightShadows: ThemeShadows = {
  card: {
    shadowColor: "#D97758",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: "#D97758",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 3,
  },
  tabBar: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const DarkShadows: ThemeShadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBar: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 10,
  },
};

/**
 * Default exports for backward-compatibility.
 * Components that haven't migrated to useTheme() yet will use light colors.
 */
export const Colors = LightColors;
export const Shadows = LightShadows;
