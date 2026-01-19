
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Read environment variables with EXPO_PUBLIC_ prefix
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Defensive runtime checks with clear error messages
if (!supabaseUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please add EXPO_PUBLIC_SUPABASE_URL to your .env file or app.json extra config.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Please add EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file or app.json extra config.'
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
