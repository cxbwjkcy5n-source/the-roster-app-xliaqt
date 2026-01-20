import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerFlagsRoutes(app: App, fastify: FastifyInstance) {

  // Delete flag (red or green)
  fastify.delete<{ Params: { id: string } }>(
    '/api/flags/:id',
    {
      schema: {
        description: 'Delete a flag (red or green)',
        tags: ['flags'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, flagId: id }, 'Deleting flag');

      // Check if it's a red flag
      let redFlag = null;
      try {
        redFlag = await app.db.query.redFlags.findFirst({
          where: eq(schema.redFlags.id, id),
          with: {
            profile: true,
          },
        });
      } catch (_) {
        // Handle case where it's not a red flag
      }

      if (redFlag) {
        // Verify ownership through the profile
        if (redFlag.profile.userId !== session.user.id) {
          app.logger.warn({ userId: session.user.id, flagId: id }, 'Unauthorized flag deletion attempt');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        const [deleted] = await app.db
          .delete(schema.redFlags)
          .where(eq(schema.redFlags.id, id))
          .returning();

        app.logger.info({ userId: session.user.id, flagId: id, flagType: 'red' }, 'Red flag deleted successfully');
        return { flagType: 'red', ...deleted };
      }

      // Check if it's a green flag
      const greenFlag = await app.db.query.greenFlags.findFirst({
        where: eq(schema.greenFlags.id, id),
        with: {
          profile: true,
        },
      });

      if (greenFlag) {
        // Verify ownership through the profile
        if (greenFlag.profile.userId !== session.user.id) {
          app.logger.warn({ userId: session.user.id, flagId: id }, 'Unauthorized flag deletion attempt');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        const [deleted] = await app.db
          .delete(schema.greenFlags)
          .where(eq(schema.greenFlags.id, id))
          .returning();

        app.logger.info({ userId: session.user.id, flagId: id, flagType: 'green' }, 'Green flag deleted successfully');
        return { flagType: 'green', ...deleted };
      }

      app.logger.warn({ userId: session.user.id, flagId: id }, 'Flag not found');
      return reply.status(404).send({ error: 'Flag not found' });
    }
  );
}
