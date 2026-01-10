
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  // Dark green gradient colors
  primary: '#1a4d2e',        // Dark Green
  primaryDark: '#0d2818',    // Even Darker Green
  secondary: '#2d6a4f',      // Medium Dark Green
  accent: '#52b788',         // Light Green
  
  background: '#0f1419',     // Dark background
  backgroundAlt: '#1a1f26',  // Alt dark background
  text: '#e3e3e3',           // Light text
  textSecondary: '#9ca3af',  // Secondary text
  grey: '#6c757d',           // Grey
  card: '#1e2329',           // Dark card background
  border: '#374151',         // Border color
  
  // Status colors
  red: '#dc3545',            // Red for flags/bench
  lowInterest: '#dc3545',    // Red for low interest
  yellow: '#ffc107',         // Yellow for medium interest
  green: '#28a745',          // Green for high interest
  
  // Additional colors
  white: '#ffffff',
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
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
  card: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: "white",
  },
  // Dark green gradient header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
});
