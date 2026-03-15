import type { FastifyRequest, FastifyReply } from 'fastify';
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
    // If Supabase is not configured, reject all protected routes
    if (!isSupabaseConfigured) {
      return reply.status(401).send({
        error: { message: 'Authentication not configured' },
      });
    }

    // Extract Bearer token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: { message: 'Missing or invalid Authorization header' },
      });
    }

    const token = authHeader.substring(7);

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
