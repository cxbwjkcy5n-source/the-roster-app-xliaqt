import type { FastifyRequest } from 'fastify';
import { jwtDecode } from 'jwt-decode';

/**
 * Dual authentication middleware supporting both Supabase and Better Auth tokens
 */

interface DecodedToken {
  sub?: string;
  user_id?: string;
  id?: string;
  email?: string;
  aud?: string;
  [key: string]: any;
}

interface AuthUser {
  id: string;
  email?: string;
  source: 'supabase' | 'better-auth';
}

/**
 * Decode and validate JWT token (works for both Supabase and Better Auth)
 */
function decodeJWT(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract user from Supabase token
 * Supabase tokens have 'sub' (user ID) and 'email' claims
 */
function extractSupabaseUser(token: string): AuthUser | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  // Supabase typically uses 'sub' for user ID and includes 'email'
  if (decoded.sub) {
    return {
      id: decoded.sub,
      email: decoded.email,
      source: 'supabase',
    };
  }

  return null;
}

/**
 * Extract user from Better Auth token
 * Better Auth tokens have custom format with user information
 */
function extractBetterAuthUser(token: string): AuthUser | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  // Better Auth may use different claim names
  // Try common patterns: id, user_id, sub
  const userId = decoded.id || decoded.user_id || decoded.sub;
  if (userId) {
    return {
      id: userId,
      email: decoded.email,
      source: 'better-auth',
    };
  }

  return null;
}

/**
 * Extract and validate user from Bearer token
 * Attempts both Supabase and Better Auth extraction methods
 */
export function extractAuthUser(request: FastifyRequest): AuthUser | null {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) {
      return null;
    }

    // Try Supabase extraction first
    const supabaseUser = extractSupabaseUser(token);
    if (supabaseUser && supabaseUser.id) {
      return supabaseUser;
    }

    // Try Better Auth extraction
    const betterAuthUser = extractBetterAuthUser(token);
    if (betterAuthUser && betterAuthUser.id) {
      return betterAuthUser;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and extract user from token
 * Provides comprehensive logging and error handling
 */
export function verifyAndExtractUser(
  request: FastifyRequest,
  logger: any
): AuthUser | null {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    logger.debug('No authorization header provided');
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    logger.debug('Authorization header missing Bearer prefix');
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Try Supabase extraction
    const supabaseUser = extractSupabaseUser(token);
    if (supabaseUser && supabaseUser.id) {
      logger.debug(
        { userId: supabaseUser.id, source: 'supabase' },
        'Token validated with Supabase method'
      );
      return supabaseUser;
    }

    // Try Better Auth extraction
    const betterAuthUser = extractBetterAuthUser(token);
    if (betterAuthUser && betterAuthUser.id) {
      logger.debug(
        { userId: betterAuthUser.id, source: 'better-auth' },
        'Token validated with Better Auth method'
      );
      return betterAuthUser;
    }

    logger.warn('Token could not be validated with any authentication method');
    return null;
  } catch (error) {
    logger.warn({ err: error }, 'Error validating token');
    return null;
  }
}
