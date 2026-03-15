import { supabase } from './supabase.js';

/**
 * Calculate compatibility score for a roster profile
 *
 * Collects non-null values from:
 * - interest_level (1-10)
 * - sexual_chemistry (1-10)
 * - attractiveness (1-10)
 * - average of dates.rating (1-10) for this profile
 *
 * Converts each to 0-100 scale and averages them
 * Returns null if all values are missing
 */
export async function calculateCompatibilityScore(
  profileId: string,
  interestLevel?: number | null,
  sexualChemistry?: number | null,
  attractiveness?: number | null,
): Promise<number | null> {
  const scores: number[] = [];

  // Add direct fields (convert 1-10 scale to 0-100)
  if (interestLevel !== null && interestLevel !== undefined) {
    scores.push((interestLevel / 10) * 100);
  }
  if (sexualChemistry !== null && sexualChemistry !== undefined) {
    scores.push((sexualChemistry / 10) * 100);
  }
  if (attractiveness !== null && attractiveness !== undefined) {
    scores.push((attractiveness / 10) * 100);
  }

  // Query average rating from dates
  try {
    const { data, error } = await supabase
      .from('dates')
      .select('rating')
      .eq('profile_id', profileId);

    if (!error && data && data.length > 0) {
      const ratings = data
        .map((d: any) => d.rating)
        .filter((r: any) => r !== null && r !== undefined);

      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
        scores.push((avgRating / 10) * 100);
      }
    }
  } catch (err) {
    console.warn('Error fetching dates for compatibility score:', err);
  }

  // If no scores collected, return null
  if (scores.length === 0) {
    return null;
  }

  // Average all scores and round to 1 decimal place
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average * 10) / 10;
}

/**
 * Attach compatibility score to a roster profile
 */
export async function attachCompatibilityScore(
  profile: Record<string, any>,
): Promise<Record<string, any>> {
  const score = await calculateCompatibilityScore(
    profile.id,
    profile.interest_level,
    profile.sexual_chemistry,
    profile.attractiveness,
  );
  return {
    ...profile,
    compatibility_score: score,
  };
}

/**
 * Attach compatibility scores to multiple profiles
 */
export async function attachCompatibilityScores(
  profiles: Record<string, any>[],
): Promise<Record<string, any>[]> {
  return Promise.all(profiles.map(attachCompatibilityScore));
}
