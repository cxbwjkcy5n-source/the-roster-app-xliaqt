import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerInteractionsRoutes(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // Create interaction
  fastify.post<{
    Body: {
      profileId: string;
      type: 'date' | 'morning_text' | 'check_in' | 'call' | 'message';
      notes?: string;
    };
  }>(
    '/api/interactions',
    {
      schema: {
        description: 'Log an interaction with a profile',
        tags: ['interactions'],
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            type: { type: 'string', enum: ['date', 'morning_text', 'check_in', 'call', 'message'] },
            notes: { type: 'string' },
          },
          required: ['profileId', 'type'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as {
        profileId: string;
        type: 'date' | 'morning_text' | 'check_in' | 'call' | 'message';
        notes?: string;
      };

      // Verify profile ownership
      const profile = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, body.profileId),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!profile) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      // Update profile's lastContactDate
      await app.db
        .update(schema.rosterProfiles)
        .set({ lastContactDate: new Date(), updatedAt: new Date() })
        .where(eq(schema.rosterProfiles.id, body.profileId));

      const [interaction] = await app.db
        .insert(schema.interactions)
        .values({
          userId: session.user.id,
          profileId: body.profileId,
          type: body.type,
          notes: body.notes,
        })
        .returning();

      return interaction;
    }
  );

  // Get interactions for a profile (chemistry timeline)
  fastify.get<{ Params: { profileId: string } }>(
    '/api/interactions/:profileId',
    {
      schema: {
        description: 'Get chemistry timeline for a profile',
        tags: ['interactions'],
        params: {
          type: 'object',
          properties: { profileId: { type: 'string' } },
          required: ['profileId'],
        },
        response: { 200: { type: 'array' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { profileId } = request.params as { profileId: string };

      // Verify profile ownership
      const profile = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, profileId),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!profile) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      const interactions = await app.db.query.interactions.findMany({
        where: and(
          eq(schema.interactions.userId, session.user.id),
          eq(schema.interactions.profileId, profileId)
        ),
        orderBy: desc(schema.interactions.timestamp),
      });

      return interactions;
    }
  );

  // Get auto-nudges (profiles not contacted in 10+ days)
  fastify.get(
    '/api/nudges',
    {
      schema: {
        description: 'Get profiles to nudge (not contacted in 10+ days)',
        tags: ['interactions'],
        response: { 200: { type: 'array' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Get current date minus 10 days
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const nudgeProfiles = await app.db
        .select({
          id: schema.rosterProfiles.id,
          name: schema.rosterProfiles.name,
          lastContactDate: schema.rosterProfiles.lastContactDate,
        })
        .from(schema.rosterProfiles)
        .where(
          and(
            eq(schema.rosterProfiles.userId, session.user.id),
            eq(schema.rosterProfiles.status, 'roster'),
            sql`${schema.rosterProfiles.lastContactDate} < ${tenDaysAgo} OR ${schema.rosterProfiles.lastContactDate} IS NULL`
          )
        );

      return nudgeProfiles;
    }
  );
}
