import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';
import { sql } from 'drizzle-orm';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerHealthRoutes(app: App, fastify: FastifyInstance) {

  // Health check endpoint (no auth required)
  fastify.get(
    '/api/health',
    {
      schema: {
        description: 'Health check endpoint - simple liveness check',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Health check request');
      return { status: 'ok' };
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
      const session = await requireDualAuth(request, reply, app);
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
