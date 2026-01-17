import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAndExtractUser } from '../middleware/dual-auth.js';
import type { App } from '../index.js';

/**
 * Enhanced authentication middleware that supports both Supabase and Better Auth
 * Can be used as a replacement for the native app.requireAuth()
 */
export async function requireDualAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  app: App
): Promise<{ user: { id: string; email?: string }; source: string } | null> {
  // Try to extract user from Bearer token (Supabase or Better Auth)
  const tokenUser = verifyAndExtractUser(request, app.logger);

  if (tokenUser && tokenUser.id) {
    app.logger.debug(
      { userId: tokenUser.id, source: tokenUser.source },
      'Authenticated via dual auth token'
    );
    return {
      user: {
        id: tokenUser.id,
        email: tokenUser.email,
      },
      source: tokenUser.source,
    };
  }

  // Fall back to native app.requireAuth() for Better Auth sessions
  try {
    const session = await app.requireAuth()(request, reply);
    if (session && session.user) {
      app.logger.debug(
        { userId: session.user.id },
        'Authenticated via native Better Auth'
      );
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
        },
        source: 'better-auth',
      };
    }
  } catch (error) {
    app.logger.debug('Native auth check failed, token auth already attempted');
  }

  // No valid authentication found
  app.logger.warn('No valid authentication found');
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
