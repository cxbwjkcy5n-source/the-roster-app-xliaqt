import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, or, lt, isNull } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerInteractionsRoutes(app: App, fastify: FastifyInstance) {

  // Create interaction
  fastify.post<{
    Body: {
      profileId: string;
      type: 'date' | 'morning_text' | 'check_in' | 'call' | 'message' | 'moved_to_bench' | 'moved_to_roster';
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
            type: { type: 'string', enum: ['date', 'morning_text', 'check_in', 'call', 'message', 'moved_to_bench', 'moved_to_roster'] },
            notes: { type: 'string' },
          },
          required: ['profileId', 'type'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as {
        profileId: string;
        type: 'date' | 'morning_text' | 'check_in' | 'call' | 'message' | 'moved_to_bench' | 'moved_to_roster';
        notes?: string;
      };

      app.logger.info({ userId: session.user.id, profileId: body.profileId, type: body.type }, 'Creating interaction');

      try {
        // Verify profile ownership
        const profile = await app.db.query.rosterProfiles.findFirst({
          where: and(
            eq(schema.rosterProfiles.id, body.profileId),
            eq(schema.rosterProfiles.userId, session.user.id)
          ),
        });

        if (!profile) {
          app.logger.warn({ userId: session.user.id, profileId: body.profileId }, 'Profile not found for interaction');
          return reply.status(404).send({ error: 'Profile not found' });
        }

        // Update profile's lastContactDate (except for bench/roster status changes)
        if (body.type !== 'moved_to_bench' && body.type !== 'moved_to_roster') {
          await app.db
            .update(schema.rosterProfiles)
            .set({ lastContactDate: new Date(), updatedAt: new Date() })
            .where(eq(schema.rosterProfiles.id, body.profileId));
        }

        const [interaction] = await app.db
          .insert(schema.interactions)
          .values({
            userId: session.user.id,
            profileId: body.profileId,
            type: body.type,
            notes: body.notes,
          })
          .returning();

        app.logger.info({ userId: session.user.id, interactionId: interaction.id, profileId: body.profileId }, 'Interaction created successfully');
        return interaction;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, profileId: body.profileId }, 'Failed to create interaction');
        return reply.status(500).send({ error: 'Failed to create interaction. Please try again.' });
      }
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
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { profileId } = request.params as { profileId: string };

      app.logger.info({ userId: session.user.id, profileId }, 'Fetching interactions for profile');

      try {
        // Verify profile ownership
        const profile = await app.db.query.rosterProfiles.findFirst({
          where: and(
            eq(schema.rosterProfiles.id, profileId),
            eq(schema.rosterProfiles.userId, session.user.id)
          ),
        });

        if (!profile) {
          app.logger.warn({ userId: session.user.id, profileId }, 'Profile not found for interactions');
          return reply.status(404).send({ error: 'Profile not found' });
        }

        const interactions = await app.db.query.interactions.findMany({
          where: and(
            eq(schema.interactions.userId, session.user.id),
            eq(schema.interactions.profileId, profileId)
          ),
          orderBy: desc(schema.interactions.timestamp),
        });

        app.logger.info({ userId: session.user.id, profileId, count: interactions.length }, 'Interactions fetched successfully');
        return interactions;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, profileId }, 'Failed to fetch interactions');
        return reply.status(500).send({ error: 'Failed to fetch interactions. Please try again.' });
      }
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
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching nudge profiles (not contacted in 10+ days)');

      try {
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
              or(
                lt(schema.rosterProfiles.lastContactDate, tenDaysAgo),
                isNull(schema.rosterProfiles.lastContactDate)
              )
            )
          );

        app.logger.info({ userId: session.user.id, count: nudgeProfiles.length }, 'Nudge profiles fetched successfully');
        return nudgeProfiles;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch nudge profiles');
        return reply.status(500).send({ error: 'Failed to fetch nudge profiles. Please try again.' });
      }
    }
  );
}
