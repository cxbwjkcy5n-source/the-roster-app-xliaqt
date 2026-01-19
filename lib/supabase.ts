
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Try to read from environment variables first, then fall back to app.json extra config
const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl;

const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey;

// Defensive runtime checks with clear error messages
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL') {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL environment variable.\n\n' +
    'To fix this, you have two options:\n\n' +
    '1. Create a .env file in the root directory with:\n' +
    '   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    '2. Update app.json extra config with your Supabase credentials:\n' +
    '   "extra": {\n' +
    '     "supabaseUrl": "https://your-project-id.supabase.co",\n' +
    '     "supabaseAnonKey": "your-anon-key"\n' +
    '   }\n\n' +
    'Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api\n\n' +
    'After adding credentials, restart the Expo dev server.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable.\n\n' +
    'To fix this, you have two options:\n\n' +
    '1. Create a .env file in the root directory with:\n' +
    '   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    '2. Update app.json extra config with your Supabase credentials:\n' +
    '   "extra": {\n' +
    '     "supabaseUrl": "https://your-project-id.supabase.co",\n' +
    '     "supabaseAnonKey": "your-anon-key"\n' +
    '   }\n\n' +
    'Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api\n\n' +
    'After adding credentials, restart the Expo dev server.'
  );
}

console.log('[Supabase] Initializing with URL:', supabaseUrl);

// Create Supabase client configured for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

console.log('[Supabase] Client initialized successfully');
