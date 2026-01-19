
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Try to read from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Defensive runtime checks with clear error messages
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL') {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL environment variable.\n\n' +
    'To fix this:\n' +
    '1. Create a .env file in the root directory with:\n' +
    '   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    '2. Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api\n\n' +
    '3. Restart the Expo dev server after adding credentials.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable.\n\n' +
    'To fix this:\n' +
    '1. Create a .env file in the root directory with:\n' +
    '   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    '2. Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api\n\n' +
    '3. Restart the Expo dev server after adding credentials.'
  );
}

console.log('[Supabase] Initializing with URL:', supabaseUrl);
console.log('[Supabase] Platform:', Platform.OS);

// Create a storage adapter that works across platforms
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // SecureStore is only available on native platforms
      if (Platform.OS === 'web') {
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
      // SecureStore is only available on native platforms
      if (Platform.OS === 'web') {
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
      // SecureStore is only available on native platforms
      if (Platform.OS === 'web') {
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
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web', // Only detect URL sessions on web
  },
});

console.log('[Supabase] Client initialized successfully');
