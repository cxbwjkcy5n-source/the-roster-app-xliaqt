import { jwtDecode } from 'jwt-decode';
import * as crypto from 'crypto';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';
const SUPABASE_ISSUER = 'https://bbtvdhdfzkyhrodgclkd.supabase.co/auth/v1';

interface SupabaseJWTPayload {
  sub: string; // userId
  email?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  [key: string]: any;
}

/**
 * Verify Supabase JWT token
 * Returns { userId, email } on success
 * Throws error on failure
 */
export function verifySupabaseToken(token: string): { userId: string; email: string } {
  try {
    // Decode without verification first to get the payload
    const decoded = jwtDecode<SupabaseJWTPayload>(token);

    // If we have a secret, verify the signature
    if (JWT_SECRET) {
      // Verify HS256 signature manually
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      const signature = Buffer.from(signatureB64, 'base64url');
      const data = `${headerB64}.${payloadB64}`;

      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(data)
        .digest();

      if (!crypto.timingSafeEqual(signature, expectedSignature)) {
        throw new Error('Invalid signature');
      }
    } else {
      // Fallback: just decode without verification
      console.warn('SUPABASE_JWT_SECRET not set, validating tokens without signature verification');
    }

    // Extract userId and email
    const userId = decoded.sub;
    const email = decoded.email || '';

    if (!userId) {
      throw new Error('No user ID in token');
    }

    return { userId, email };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Token verification failed: ${message}`);
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
