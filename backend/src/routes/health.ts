import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

export function registerHealthRoutes(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // Health check endpoint (no auth required)
  fastify.get(
    '/api/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    }
  );

  // Auth health check (requires auth)
  fastify.get(
    '/api/health/auth',
    {
      schema: {
        description: 'Authentication health check (requires authentication)',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              authenticated: { type: 'boolean' },
              userId: { type: 'string' },
              email: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      return {
        status: 'ok',
        authenticated: true,
        userId: session.user.id,
        email: session.user.email,
        timestamp: new Date().toISOString(),
      };
    }
  );
}
