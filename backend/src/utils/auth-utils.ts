import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAndExtractUser } from '../middleware/dual-auth.js';
import type { App } from '../index.js';
import * as authSchema from '../db/auth-schema.js';

/**
 * Enhanced authentication middleware that supports both Supabase and Better Auth
 * Returns session object compatible with native app.requireAuth()
 */
export async function requireDualAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  app: App
): Promise<any | null> {
  app.logger.info('Authenticating request');

  // Try to extract user from Bearer token (Supabase or Better Auth)
  const tokenUser = verifyAndExtractUser(request, app.logger);

  if (tokenUser && tokenUser.id) {
    app.logger.info(
      { userId: tokenUser.id, email: tokenUser.email, source: tokenUser.source },
      'User authenticated via Bearer token'
    );

    // Return session object compatible with requireAuth format
    return {
      user: {
        id: tokenUser.id,
        email: tokenUser.email,
        name: tokenUser.email?.split('@')[0] || 'User',
        emailVerified: true,
      },
      session: {
        token: request.headers.authorization?.substring(7),
      },
    };
  }

  // Fall back to native app.requireAuth() for Better Auth sessions
  try {
    app.logger.debug('Token auth failed, attempting native Better Auth session');
    const session = await app.requireAuth()(request, reply);
    if (session && session.user) {
      app.logger.info(
        { userId: session.user.id, email: session.user.email },
        'User authenticated via native Better Auth session'
      );
      return session;
    }
  } catch (error) {
    app.logger.debug({ err: error }, 'Native auth check failed');
  }

  // No valid authentication found
  app.logger.warn('Authentication failed - no valid token or session');
  return reply.status(401).send({
    error: { message: 'Unauthorized' },
  });
}

/**
 * Get the user ID from a request using dual auth
 * Returns the user ID if authenticated, null otherwise
 */
export function getUserIdFromRequest(request: FastifyRequest, app: App): string | null {
  // Try token-based auth (Supabase or Better Auth)
  const tokenUser = verifyAndExtractUser(request, app.logger);
  if (tokenUser && tokenUser.id) {
    return tokenUser.id;
  }

  return null;
}

/**
 * Check if a request has valid authentication
 */
export function isAuthenticated(request: FastifyRequest, app: App): boolean {
  const tokenUser = verifyAndExtractUser(request, app.logger);
  return tokenUser !== null && tokenUser.id !== undefined;
}

/**
 * Auto-upsert user row to prevent foreign key violations
 * Ensures the user row exists before any queries that reference it
 * Only inserts id, using default/placeholder values for required columns
 */
export async function ensureUserExists(app: App, userId: string): Promise<void> {
  try {
    await app.db
      .insert(authSchema.user)
      .values({ id: userId, email: `${userId}@placeholder.local`, name: userId })
      .onConflictDoNothing();
  } catch (error) {
    app.logger.warn({ userId, err: error }, 'Failed to auto-upsert user row');
    // Don't throw - the row may already exist or user may have data issues
  }
}
