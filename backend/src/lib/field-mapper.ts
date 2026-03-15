/**
 * Convert camelCase to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Map field names from API format (camelCase or snake_case) to Supabase format (snake_case)
 * Accepts both camelCase and snake_case and converts to snake_case
 */
export function mapFieldsToSupabase(data: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // If already snake_case, keep it
    if (key.includes('_')) {
      mapped[key] = value;
    } else {
      // Convert camelCase to snake_case
      mapped[camelToSnake(key)] = value;
    }
  }

  return mapped;
}

/**
 * Map field names from Supabase format (snake_case) to API response format (snake_case for now)
 * Can be extended to convert to camelCase if needed
 */
export function mapFieldsFromSupabase(data: Record<string, any>): Record<string, any> {
  // For now, return as-is (snake_case)
  // In the future, this could convert to camelCase for API responses
  return data;
}
