import { supabase } from './supabase.js';

/**
 * Generate a random 6-character alphanumeric share code (A-Z, 0-9)
 */
export function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Ensure user profile exists in the database
 * If not found, creates one with auto-generated share code
 */
export async function ensureUserProfile(userId: string, email: string): Promise<Record<string, any>> {
  try {
    // Try to fetch existing profile
    const { data: existing, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.warn('Error fetching user profile:', fetchError);
    }

    // If profile exists, return it
    if (existing) {
      return existing;
    }

    // Create new profile with generated share code
    const shareCode = generateShareCode();
    const { data: created, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        share_code: shareCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (createError) {
      console.warn('Error creating user profile:', createError);
      // Return a minimal profile if creation fails
      return { id: userId, email, share_code: shareCode };
    }

    return created || { id: userId, email, share_code: shareCode };
  } catch (error) {
    console.warn('Error in ensureUserProfile:', error);
    // Return minimal profile to allow app to continue
    return { id: userId, email, share_code: generateShareCode() };
  }
}

/**
 * Transform snake_case user_profiles row to camelCase API response
 */
export function transformUserProfile(profile: Record<string, any>): Record<string, any> {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phoneNumber: profile.phone_number,
    location: profile.location,
    birthday: profile.birthday,
    datingIntention: profile.dating_intention,
    relationshipType: profile.relationship_type,
    notificationsEnabled: profile.notifications_enabled,
    image: profile.profile_image_url,
    profileImageUrl: profile.profile_image_url,
    shareCode: profile.share_code,
    profileCompleted: profile.profile_completed,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}
