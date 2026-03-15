import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * Ensure user row exists in the users table
 * Uses SELECT-then-INSERT pattern to avoid upsert/conflict issues
 */
export async function ensureUserExists(
  userId: string,
  email: string,
  name: string
): Promise<void> {
  try {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured) {
      return;
    }

    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (selectError) {
      console.warn('Error checking if user exists:', selectError);
      return;
    }

    // If user already exists, return immediately
    if (existingUser) {
      return;
    }

    // User doesn't exist, insert new user
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.warn('Error inserting user:', insertError);
      // Don't throw - just log and continue
    }
  } catch (error) {
    console.warn('Failed to ensure user exists:', error);
    // Don't throw - just log and continue
  }
}
