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
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              database: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      let dbStatus = 'ok';

      try {
        // Test database connection
        await app.db.execute(sql`SELECT 1`);
      } catch (error) {
        app.logger.warn({ err: error }, 'Database health check failed');
        dbStatus = 'degraded';
      }

      return {
        status: 'ok',
        database: dbStatus,
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
