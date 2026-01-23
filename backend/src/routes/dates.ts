import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, lt } from 'drizzle-orm';
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

      try {
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
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, profileId: body.profileId }, 'Failed to create date record');
        return reply.status(500).send({ error: 'Failed to create date record. Please try again.' });
      }
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

      try {
        // First, update any upcoming dates that have passed their dateTime to completed status
        const now = new Date();
        const upcomingDatesToUpdate = await app.db
          .select()
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              eq(schema.dates.status, 'upcoming'),
              lt(schema.dates.dateTime, now)
            )
          );

        if (upcomingDatesToUpdate.length > 0) {
          app.logger.info(
            { userId: session.user.id, count: upcomingDatesToUpdate.length },
            'Auto-updating passed upcoming dates to completed'
          );

          // Update all passed dates to completed
          await app.db
            .update(schema.dates)
            .set({ status: 'completed' })
            .where(
              and(
                eq(schema.dates.userId, session.user.id),
                eq(schema.dates.status, 'upcoming'),
                lt(schema.dates.dateTime, now)
              )
            );
        }

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
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, status }, 'Failed to fetch dates');
        return reply.status(500).send({ error: 'Failed to fetch dates. Please try again.' });
      }
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

      app.logger.info({ userId: session.user.id, dateId: id }, 'Updating date record');

      try {
        // Verify ownership
        const existing = await app.db.query.dates.findFirst({
          where: and(eq(schema.dates.id, id), eq(schema.dates.userId, session.user.id)),
        });

        if (!existing) {
          app.logger.warn({ userId: session.user.id, dateId: id }, 'Date not found for update');
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

        app.logger.info({ userId: session.user.id, dateId: id }, 'Date record updated successfully');
        return updated;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, dateId: id }, 'Failed to update date record');
        return reply.status(500).send({ error: 'Failed to update date record. Please try again.' });
      }
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

      app.logger.info({ userId: session.user.id, dateId: id }, 'Deleting date record');

      try {
        // Verify ownership
        const existing = await app.db.query.dates.findFirst({
          where: and(eq(schema.dates.id, id), eq(schema.dates.userId, session.user.id)),
        });

        if (!existing) {
          app.logger.warn({ userId: session.user.id, dateId: id }, 'Date not found for deletion');
          return reply.status(404).send({ error: 'Date not found' });
        }

        const [deleted] = await app.db
          .delete(schema.dates)
          .where(eq(schema.dates.id, id))
          .returning();

        app.logger.info({ userId: session.user.id, dateId: id }, 'Date record deleted successfully');
        return deleted;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, dateId: id }, 'Failed to delete date record');
        return reply.status(500).send({ error: 'Failed to delete date record. Please try again.' });
      }
    }
  );
}
