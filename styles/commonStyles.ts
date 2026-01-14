
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// THE ROSTER - Complete Brand Design System
// Modern, sexy-retro, playful, confident, slightly scandalous
// Premium dating hotline aesthetic with Apple-style clarity

export const colors = {
  // PRIMARY BRAND COLORS
  rosterGreen: '#11A36A',        // Primary Header Color (Roster Screen)
  benchRed: '#E9243F',           // Bench Header Color (Bench Screen)
  actionRed: '#E9243F',          // Primary Action Red (Buttons, alerts, CTA)
  
  // BASE COLORS
  white: '#FFFFFF',              // Primary White Background
  darkText: '#2A2A2A',           // Primary Dark Text
  charcoal: '#444444',           // Soft Charcoal (secondary text)
  
  // ACCENT COLORS
  mutedGold: '#C8A04F',          // Muted Gold Accent (premium elements)
  retroTeal: '#2FB8A8',          // Retro Teal Accent (optional)
  warmBlush: '#EAD3C8',          // Warm Blush/Nude Accent
  
  // UI COLORS
  background: '#FFFFFF',
  backgroundAlt: '#F5F5F5',
  text: '#2A2A2A',
  textSecondary: '#444444',
  grey: '#9A9A9A',               // Inactive items
  border: '#E5E7EB',
  card: '#FFFFFF',
  
  // STATUS COLORS (Interest Levels)
  success: '#11A36A',            // High interest / Like (Roster green)
  warning: '#FFC107',            // Medium interest
  danger: '#E9243F',             // Low interest / Pass (Roster red)
  
  // DATING TAB COLORS
  datingBackground: '#FFFFFF',
  datingActionButton: '#E9243F',
  datingBadgeTeal: '#2FB8A8',
  datingBadgeGold: '#C8A04F',
  
  // SWIPE INDICATORS
  swipeLike: '#11A36A',          // Roster green
  swipePass: '#E9243F',          // Roster red
  swipeSuperInterest: '#C8A04F', // Gold
  
  // NAVIGATION BAR
  navBackground: '#FFFFFF',
  navActive: '#11A36A',
  navInactive: '#9A9A9A',
  navFAB: '#E9243F',             // Floating action button (retro red)
  
  // SUB-MENU COLORS
  submenuBackground: '#FFFFFF',
  submenuActiveIcon: '#11A36A',
  submenuInactiveIcon: '#9A9A9A',
  submenuSelectedUnderline: '#11A36A',
  
  // BENCH TAB COLORS
  benchHeader: '#E9243F',
  benchCardOutline: '#E5E7EB',
  benchOfflineStatus: '#EAD3C8',
  
  // LEGACY COMPATIBILITY
  primary: '#11A36A',
  primaryDark: '#0d7a52',
  secondary: '#2FB8A8',
  accent: '#C8A04F',
  red: '#E9243F',
  lowInterest: '#E9243F',
  yellow: '#FFC107',
  green: '#11A36A',
};

export const buttonStyles = StyleSheet.create({
  // Rounded-pill buttons with soft shadows
  primaryButton: {
    backgroundColor: colors.actionRed,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: colors.rosterGreen,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.actionRed,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.actionRed,
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  
  // TYPOGRAPHY - Bold Sans for Headlines, Rounded Sans for Body
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.darkText,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkText,
    marginBottom: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.charcoal,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.grey,
    lineHeight: 18,
  },
  
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  // CARD COMPONENTS - White cards with 12-20 radius, minimal borders
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardCompact: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.white,
  },
  
  // ROSTER HEADER - Green gradient with rounded corners
  rosterHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  // BENCH HEADER - Red gradient with rounded corners
  benchHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  
  // PREMIUM ELEMENTS - Muted gold accents
  premiumBadge: {
    backgroundColor: colors.mutedGold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  
  // RETRO ACCENTS - Glossy, 3D feel with soft shadows
  glossyButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
});

// GRADIENT PRESETS
export const gradients = {
  rosterGreen: ['#11A36A', '#0d8555'],
  benchRed: ['#E9243F', '#c41e35'],
  actionRed: ['#E9243F', '#ff4757'],
  retroTeal: ['#2FB8A8', '#26a69a'],
  mutedGold: ['#C8A04F', '#b8903f'],
  warmBlush: ['#EAD3C8', '#ddc3b8'],
};

export default {
  colors,
  buttonStyles,
  commonStyles,
  gradients,
};
