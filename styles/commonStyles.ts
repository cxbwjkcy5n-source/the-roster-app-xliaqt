
import { StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';

// THE ROSTER - Sophisticated Red Rotary Phone Design System
// Inspired by vintage rotary phones with modern, grown-up aesthetics
// Colors: Deep red, black, cream, metallic silver accents

export const colors = {
  // PRIMARY BRAND COLORS - Rotary Phone Inspired
  rosterRed: '#C41E3A',           // Deep sophisticated red (rotary phone red)
  darkRed: '#8B1A2E',             // Darker red for depth
  lightRed: '#E94B5F',            // Lighter red for highlights
  
  // NEUTRAL PALETTE - Sophisticated & Grown
  black: '#1A1A1A',               // Rich black (not pure black)
  charcoal: '#2D2D2D',            // Soft charcoal
  darkGray: '#4A4A4A',            // Dark gray for secondary text
  mediumGray: '#7A7A7A',          // Medium gray for inactive elements
  lightGray: '#D4D4D4',           // Light gray for borders
  cream: '#F5F1E8',               // Warm cream background
  white: '#FFFFFF',               // Pure white for contrast
  
  // ACCENT COLORS - Metallic & Sophisticated
  silver: '#C0C0C0',              // Metallic silver (phone dial)
  gold: '#D4AF37',                // Muted gold for premium elements
  bronze: '#CD7F32',              // Bronze for special highlights
  
  // UI COLORS
  background: '#FFFFFF',          // Light mode background
  backgroundDark: '#1A1A1A',      // Dark mode background
  backgroundAlt: '#F5F1E8',       // Cream alternative background
  card: '#FFFFFF',                // Card background
  cardDark: '#2D2D2D',            // Dark mode card
  
  // TEXT COLORS
  text: '#1A1A1A',                // Primary text (black)
  textDark: '#FFFFFF',            // Dark mode primary text
  textSecondary: '#4A4A4A',       // Secondary text
  textSecondaryDark: '#D4D4D4',   // Dark mode secondary text
  textTertiary: '#7A7A7A',        // Tertiary text
  
  // STATUS COLORS (Interest Levels)
  high: '#2D8B4E',                // High interest (green)
  medium: '#D4AF37',              // Medium interest (gold)
  low: '#C41E3A',                 // Low interest (red)
  
  // FUNCTIONAL COLORS
  success: '#2D8B4E',
  warning: '#D4AF37',
  danger: '#C41E3A',
  info: '#4A90E2',
  
  // NAVIGATION & INTERACTION
  primary: '#C41E3A',             // Primary action color (red)
  primaryDark: '#8B1A2E',         // Darker primary
  secondary: '#1A1A1A',           // Secondary action (black)
  accent: '#D4AF37',              // Accent (gold)
  
  // BORDERS & DIVIDERS
  border: '#D4D4D4',
  borderDark: '#4A4A4A',
  divider: '#E5E5E5',
  
  // LEGACY COMPATIBILITY (for existing code)
  rosterGreen: '#2D8B4E',
  benchRed: '#C41E3A',
  actionRed: '#C41E3A',
  darkText: '#1A1A1A',
  grey: '#7A7A7A',
  lowInterest: '#C41E3A',
  yellow: '#D4AF37',
  green: '#2D8B4E',
  red: '#C41E3A',
  mutedGold: '#D4AF37',
  retroTeal: '#4A90E2',
  warmBlush: '#F5F1E8',
};

export const typography = {
  // FONT FAMILIES - Sophisticated & Grown
  // Using system fonts for reliability
  heading: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }),
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }),
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  label: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }),
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
};

export const buttonStyles = StyleSheet.create({
  // PRIMARY BUTTON - Red with subtle shadow
  primaryButton: {
    backgroundColor: colors.rosterRed,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.5,
  },
  
  // SECONDARY BUTTON - Black outline
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    letterSpacing: 0.5,
  },
  
  // TERTIARY BUTTON - Text only
  tertiaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.rosterRed,
  },
  
  // ICON BUTTON - Circular
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.rosterRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export const commonStyles = StyleSheet.create({
  // LAYOUT
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // TYPOGRAPHY - Sophisticated hierarchy
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 24,
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textTertiary,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  // CARDS - Clean, minimal shadows
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompact: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // INPUTS - Clean, sophisticated
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.rosterRed,
    borderWidth: 2,
  },
  
  // DIVIDERS
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },
  dividerThick: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  
  // SHADOWS - Subtle, sophisticated
  shadowSm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  shadowMd: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowLg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
});

// GRADIENT PRESETS - Sophisticated reds and neutrals
export const gradients = {
  primary: [colors.rosterRed, colors.darkRed],
  secondary: [colors.black, colors.charcoal],
  accent: [colors.gold, colors.bronze],
  light: [colors.white, colors.cream],
  dark: [colors.charcoal, colors.black],
  
  // Legacy compatibility
  rosterGreen: [colors.rosterGreen, '#1F6B3A'],
  benchRed: [colors.rosterRed, colors.darkRed],
  actionRed: [colors.rosterRed, colors.darkRed],
  retroTeal: [colors.retroTeal, '#3A7BC8'],
  mutedGold: [colors.gold, colors.bronze],
  warmBlush: [colors.cream, '#EDE5D8'],
};

// SPACING SYSTEM - Consistent 8px grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// BORDER RADIUS - Consistent rounded corners
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export default {
  colors,
  typography,
  buttonStyles,
  commonStyles,
  gradients,
  spacing,
  borderRadius,
};
