import type { FastifyRequest, FastifyReply } from 'fastify';
import { jwtDecode } from 'jwt-decode';
import type { App } from '../index.js';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

interface JWTPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract and verify Supabase JWT token from Authorization header
 */
export function extractUserFromToken(
  request: FastifyRequest
): { userId: string; email: string } | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    if (!decoded.sub || !decoded.email) {
      return null;
    }
    return {
      userId: decoded.sub,
      email: decoded.email,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const auth = extractUserFromToken(request);
  if (!auth) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  return auth;
}

/**
 * Ensure user exists in the database
 */
export async function ensureUserExists(
  app: App,
  userId: string,
  email: string
): Promise<void> {
  try {
    // Check if user exists
    const existing = await app.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!existing) {
      // Insert user if doesn't exist
      await app.db.insert(schema.users).values({
        id: userId,
        email,
      });
    }
  } catch (error) {
    app.logger.warn({ userId, err: error }, 'Failed to ensure user exists');
  }
}
