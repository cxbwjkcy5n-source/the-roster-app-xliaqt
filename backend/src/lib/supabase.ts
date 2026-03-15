import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Allow missing credentials in test environment, but log warning
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. ' +
    'Supabase features will not work. Set these environment variables for production use.'
  );
}

// Create client with dummy credentials if not available (for testing)
export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseServiceRoleKey || 'dummy-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type SupabaseClient = typeof supabase;

// Flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceRoleKey);
