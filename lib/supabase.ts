
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Try to read from environment variables first, then fall back to app.json
const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl;

const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey;

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' &&
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
    supabaseUrl.includes('supabase.co')
  );
}

// Defensive runtime checks with clear error messages
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL') {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL environment variable.\n\n' +
    'To fix this:\n' +
    '1. Create a .env file in the root directory with:\n' +
    '   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    '2. Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api\n\n' +
    '3. Restart the Expo dev server after adding credentials.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable.\n\n' +
    'To fix this:\n' +
    '1. Create a .env file in the root directory with:\n' +
    '   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    '2. Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api\n\n' +
    '3. Restart the Expo dev server after adding credentials.'
  );
}

// Helper function to safely get platform - LAZY IMPORT
function getPlatform(): 'ios' | 'android' | 'web' | 'unknown' {
  try {
    // Lazy import Platform only when needed
    const { Platform } = require('react-native');
    if (Platform && Platform.OS) {
      return Platform.OS;
    }
  } catch (e) {
    // Platform not available (e.g., during SSR or initial web load)
  }
  
  // Fallback detection for web
  if (typeof window !== 'undefined') {
    return 'web';
  }
  
  return 'unknown';
}

console.log('[Supabase] Initializing with URL:', supabaseUrl);
console.log('[Supabase] Is configured:', isSupabaseConfigured());

// Create a storage adapter that works across platforms
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const platform = getPlatform();
      console.log('[Supabase Storage] Getting item on platform:', platform);
      
      // SecureStore is only available on native platforms
      if (platform === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      
      // Use SecureStore for native platforms
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error('[Supabase Storage] Error getting item:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const platform = getPlatform();
      console.log('[Supabase Storage] Setting item on platform:', platform);
      
      // SecureStore is only available on native platforms
      if (platform === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      
      // Use SecureStore for native platforms
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('[Supabase Storage] Error setting item:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const platform = getPlatform();
      console.log('[Supabase Storage] Removing item on platform:', platform);
      
      // SecureStore is only available on native platforms
      if (platform === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      
      // Use SecureStore for native platforms
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('[Supabase Storage] Error removing item:', error);
    }
  },
};

// Create Supabase client configured for React Native and Web
// Use placeholder values if not configured to prevent initialization errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: typeof window !== 'undefined', // Only detect URL sessions on web
    },
  }
);

if (isSupabaseConfigured()) {
  console.log('[Supabase] Client initialized successfully');
} else {
  console.warn('[Supabase] Client initialized with placeholder values - authentication will not work until configured');
}
