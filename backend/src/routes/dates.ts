import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerDatesRoutes(app: App, fastify: FastifyInstance) {

  // Create new date
  fastify.post<{
    Body: {
      profileId: string;
      status?: string;
      type?: string;
      dateTime?: string;
      locationName?: string;
      locationAddress?: string;
      locationCoordinates?: { lat: number; lng: number };
      notes?: string;
      rating?: number;
      wouldGoAgain?: boolean;
      reminderSettings?: { oneHourBefore?: boolean; oneDayBefore?: boolean; oneWeekBefore?: boolean };
    };
  }>(
    '/api/dates',
    {
      schema: {
        description: 'Create a new date record',
        tags: ['dates'],
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            status: { type: 'string', enum: ['upcoming', 'completed'] },
            type: { type: 'string', enum: ['casual', 'formal', 'activity', 'dinner', 'drinks', 'coffee'] },
            dateTime: { type: 'string' },
            locationName: { type: 'string' },
            locationAddress: { type: 'string' },
            locationCoordinates: {
              type: 'object',
              properties: { lat: { type: 'number' }, lng: { type: 'number' } },
            },
            notes: { type: 'string' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            wouldGoAgain: { type: 'boolean' },
            reminderSettings: {
              type: 'object',
              properties: {
                oneHourBefore: { type: 'boolean' },
                oneDayBefore: { type: 'boolean' },
                oneWeekBefore: { type: 'boolean' },
              },
            },
          },
          required: ['profileId'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as {
        profileId: string;
        status?: string;
        type?: string;
        dateTime?: string;
        locationName?: string;
        locationAddress?: string;
        locationCoordinates?: { lat: number; lng: number };
        notes?: string;
        rating?: number;
        wouldGoAgain?: boolean;
        reminderSettings?: { oneHourBefore?: boolean; oneDayBefore?: boolean; oneWeekBefore?: boolean };
      };

      app.logger.info({ userId: session.user.id, profileId: body.profileId }, 'Creating new date record');

      // Verify that the profile belongs to the user
      const profile = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, body.profileId),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!profile) {
        app.logger.warn({ userId: session.user.id, profileId: body.profileId }, 'Profile not found for date creation');
        return reply.status(404).send({ error: 'Profile not found' });
      }

      const [date] = await app.db
        .insert(schema.dates)
        .values({
          userId: session.user.id,
          profileId: body.profileId,
          status: body.status as 'upcoming' | 'completed' | undefined,
          type: body.type as 'casual' | 'formal' | 'activity' | 'dinner' | 'drinks' | 'coffee' | undefined,
          dateTime: body.dateTime ? new Date(body.dateTime) : undefined,
          locationName: body.locationName,
          locationAddress: body.locationAddress,
          locationCoordinates: body.locationCoordinates,
          notes: body.notes,
          rating: body.rating,
          wouldGoAgain: body.wouldGoAgain,
          reminderSettings: body.reminderSettings,
        })
        .returning();

      app.logger.info({ dateId: date.id, userId: session.user.id, profileId: body.profileId }, 'Date record created successfully');
      return date;
    }
  );

  // Get all dates for user (with query params for status filtering)
  fastify.get<{ Querystring: { status?: 'upcoming' | 'completed' } }>(
    '/api/dates',
    {
      schema: {
        description: 'Get all dates for the authenticated user',
        tags: ['dates'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['upcoming', 'completed'] },
          },
        },
        response: { 200: { type: 'array' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { status } = request.query as { status?: 'upcoming' | 'completed' };

      app.logger.info({ userId: session.user.id, status }, 'Fetching dates');

      // Status filtering
      if (status) {
        const filteredDates = await app.db
          .select()
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              eq(schema.dates.status, status)
            )
          );
        app.logger.info({ userId: session.user.id, status, count: filteredDates.length }, 'Filtered dates fetched successfully');
        return filteredDates;
      }

      const allDates = await app.db
        .query.dates.findMany({
          where: eq(schema.dates.userId, session.user.id),
          with: {
            profile: true,
          },
        });

      app.logger.info({ userId: session.user.id, count: allDates.length }, 'All dates fetched successfully');
      return allDates;
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
      const session = await requireDualAuth(request, reply, app);
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
      const session = await requireDualAuth(request, reply, app);
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
