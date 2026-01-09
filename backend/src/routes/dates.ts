import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerDatesRoutes(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // Create new date
  fastify.post<{ Body: { profileId: string; dateType?: string; dateTime?: string; notes?: string } }>(
    '/api/dates',
    {
      schema: {
        description: 'Create a new date record',
        tags: ['dates'],
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            dateType: { type: 'string', enum: ['upcoming', 'completed'] },
            dateTime: { type: 'string' },
            notes: { type: 'string' },
          },
          required: ['profileId'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as { profileId: string; dateType?: string; dateTime?: string; notes?: string };

      // Verify that the profile belongs to the user
      const profile = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, body.profileId),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!profile) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      const [date] = await app.db
        .insert(schema.dates)
        .values({
          userId: session.user.id,
          profileId: body.profileId,
          dateType: body.dateType as 'upcoming' | 'completed' | undefined,
          dateTime: body.dateTime ? new Date(body.dateTime) : undefined,
          notes: body.notes,
        })
        .returning();

      return date;
    }
  );

  // Get all dates for user (with query params for type filtering)
  fastify.get<{ Querystring: { type?: 'upcoming' | 'completed' } }>(
    '/api/dates',
    {
      schema: {
        description: 'Get all dates for the authenticated user',
        tags: ['dates'],
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['upcoming', 'completed'] },
          },
        },
        response: { 200: { type: 'array' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { type } = request.query as { type?: 'upcoming' | 'completed' };

      let query = app.db.query.dates.findMany({
        where: eq(schema.dates.userId, session.user.id),
        with: {
          profile: true,
        },
      });

      // Type filtering happens in the findMany with condition
      if (type) {
        const dates = await app.db
          .select()
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              eq(schema.dates.dateType, type)
            )
          );
        return dates;
      }

      const dates = await app.db
        .query.dates.findMany({
          where: eq(schema.dates.userId, session.user.id),
          with: {
            profile: true,
          },
        });

      return dates;
    }
  );

  // Update date
  fastify.put<{ Params: { id: string }; Body: { [key: string]: any } }>(
    '/api/dates/:id',
    {
      schema: {
        description: 'Update a date record',
        tags: ['dates'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: { type: 'object' },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as { [key: string]: any };

      // Verify ownership
      const existing = await app.db.query.dates.findFirst({
        where: and(eq(schema.dates.id, id), eq(schema.dates.userId, session.user.id)),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Date not found' });
      }

      const updateData: Record<string, any> = { ...body };
      if (body.dateTime) {
        updateData.dateTime = new Date(body.dateTime);
      }

      const [updated] = await app.db
        .update(schema.dates)
        .set(updateData)
        .where(eq(schema.dates.id, id))
        .returning();

      return updated;
    }
  );

  // Delete date
  fastify.delete<{ Params: { id: string } }>(
    '/api/dates/:id',
    {
      schema: {
        description: 'Delete a date record',
        tags: ['dates'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      // Verify ownership
      const existing = await app.db.query.dates.findFirst({
        where: and(eq(schema.dates.id, id), eq(schema.dates.userId, session.user.id)),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Date not found' });
      }

      const [deleted] = await app.db
        .delete(schema.dates)
        .where(eq(schema.dates.id, id))
        .returning();

      return deleted;
    }
  );
}
