import type { FastifyRequest, FastifyReply } from 'fastify';
import { jwtDecode } from 'jwt-decode';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export async function supabaseAuthMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: { message: 'Missing or invalid Authorization header' },
      });
    }

    const token = authHeader.substring(7);

    // Check if this is a mock token (for testing)
    if (token.startsWith('mock.')) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          request.userId = payload.sub;
          request.userEmail = payload.email || '';
          request.userName = payload.name || payload.email?.split('@')[0] || '';
          return;
        }
      } catch (parseError) {
        return reply.status(401).send({
          error: { message: 'Invalid mock token' },
        });
      }
    }

    // Try to decode JWT (supports both Supabase and Better Auth tokens)
    try {
      const decoded = jwtDecode<any>(token);

      // Better Auth token format
      if (decoded.id || (decoded.user_id && !decoded.sub)) {
        request.userId = decoded.id || decoded.user_id;
        request.userEmail = decoded.email || '';
        request.userName = decoded.name || decoded.email?.split('@')[0] || '';
        return;
      }

      // Supabase token format (uses 'sub' for user ID)
      if (decoded.sub) {
        request.userId = decoded.sub;
        request.userEmail = decoded.email || '';
        request.userName = decoded.name || decoded.email?.split('@')[0] || '';
        return;
      }
    } catch (decodeError) {
      // Not a valid JWT, continue to Supabase auth check
    }

    // If Supabase is not configured, can't use real tokens
    if (!isSupabaseConfigured) {
      return reply.status(401).send({
        error: { message: 'Authentication not configured' },
      });
    }

    // Verify token using Supabase auth.getUser()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.status(401).send({
        error: { message: 'Invalid or expired token' },
      });
    }

    // Attach user info to request
    request.userId = user.id;
    request.userEmail = user.email || '';
    request.userName = user.user_metadata?.name || user.email?.split('@')[0] || '';

  } catch (err) {
    return reply.status(401).send({
      error: { message: 'Authentication failed' },
    });
  }
}

export async function requireAuth(request: AuthenticatedRequest, reply: FastifyReply) {
  if (!request.userId) {
    return reply.status(401).send({
      error: { message: 'Unauthorized' },
    });
  }
}
