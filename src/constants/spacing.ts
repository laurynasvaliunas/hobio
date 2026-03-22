/**
 * Hobio Design Tokens — Spacing, sizing, and typography scale.
 *
 * Use these instead of magic numbers in styles. Matches the 4px grid system.
 */

// ── Spacing (margins, padding, gaps) ──
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

// ── Border Radius ──
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

// ── Font Sizes ──
export const FontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  "2xl": 20,
  "3xl": 24,
  "4xl": 30,
  "5xl": 36,
} as const;

// ── Component Heights ──
export const ComponentHeight = {
  input: 52,
  button: 52,
  tabBar: 64,
  header: 56,
  avatar: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  },
} as const;

// ── Hit Slop (touch targets) ──
export const HitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 10, bottom: 10, left: 10, right: 10 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;
