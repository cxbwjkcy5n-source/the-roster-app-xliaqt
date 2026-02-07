import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, lt } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth } from '../utils/auth-utils.js';
import { gateway } from '@specific-dev/framework';
import { generateObject } from 'ai';
import { z } from 'zod';

const DateSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      estimatedCost: z.string(),
      duration: z.string(),
      whyPerfect: z.string(),
      address: z.string().optional(),
      websiteUrl: z.string().optional(),
      googleMapsUrl: z.string().optional(),
    }).required({ name: true, type: true, description: true, estimatedCost: true, duration: true, whyPerfect: true })
  ),
});

type DateSuggestion = z.infer<typeof DateSuggestionSchema>;

/**
 * Helper function to validate and correct status based on dateTime
 * Prevents setting status to "upcoming" if dateTime is in the past
 */
function getCorrectStatus(
  requestedStatus: string | undefined,
  dateTime: Date | null | undefined,
  logger: any,
  context: string
): string | undefined {
  if (!requestedStatus || !dateTime) return requestedStatus;

  if (requestedStatus === 'upcoming') {
    const now = new Date();
    if (dateTime < now) {
      logger.info(
        { context },
        'Status "upcoming" rejected - dateTime is in the past. Auto-correcting to "completed"'
      );
      return 'completed';
    }
  }
  return requestedStatus;
}

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
            type: { type: 'string', enum: ['casual', 'formal', 'activity', 'dinner', 'drinks', 'coffee', 'movie', 'outdoor', 'other'] },
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
            type: body.type as 'casual' | 'formal' | 'activity' | 'dinner' | 'drinks' | 'coffee' | 'movie' | 'outdoor' | 'other' | undefined,
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

      app.logger.info({ userId: session.user.id, dateId: id, updates: Object.keys(body) }, 'Updating date record');

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
        let dateTime = existing.dateTime;

        if (body.dateTime) {
          dateTime = new Date(body.dateTime);
          updateData.dateTime = dateTime;
        }

        // Use helper function to validate and correct status based on dateTime
        // If status is "upcoming" but dateTime is in the past, auto-correct to "completed"
        if (body.status) {
          const correctedStatus = getCorrectStatus(
            body.status,
            dateTime,
            app.logger,
            `userId=${session.user.id},dateId=${id}`
          );
          if (correctedStatus) {
            updateData.status = correctedStatus;
          }
        }

        const [updated] = await app.db
          .update(schema.dates)
          .set(updateData)
          .where(eq(schema.dates.id, id))
          .returning();

        // Log analytics-affecting changes
        const analyticsFields = ['status', 'rating', 'wouldGoAgain'];
        const changedAnalyticsFields = analyticsFields.filter(field => field in body);
        if (changedAnalyticsFields.length > 0) {
          app.logger.info(
            {
              userId: session.user.id,
              dateId: id,
              analyticsChanges: changedAnalyticsFields,
              newValues: changedAnalyticsFields.reduce((acc, field) => ({ ...acc, [field]: body[field] }), {}),
            },
            'Analytics-affecting date fields updated - analytics will recalculate on next fetch'
          );
        }

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

  // Generate date suggestions using AI
  fastify.post<{
    Body: {
      profileId: string;
      budget: string;
      duration: string;
      preferences?: string;
      location: string;
    };
  }>(
    '/api/dates/plan',
    {
      schema: {
        description: 'Generate AI-powered date suggestions with real places',
        tags: ['dates'],
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            budget: { type: 'string' },
            duration: { type: 'string' },
            preferences: { type: 'string' },
            location: { type: 'string' },
          },
          required: ['profileId', 'budget', 'duration', 'location'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    description: { type: 'string' },
                    estimatedCost: { type: 'string' },
                    duration: { type: 'string' },
                    whyPerfect: { type: 'string' },
                    address: { type: 'string' },
                    websiteUrl: { type: 'string' },
                    googleMapsUrl: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as {
        profileId: string;
        budget: string;
        duration: string;
        preferences?: string;
        location: string;
      };

      app.logger.info(
        {
          userId: session.user.id,
          profileId: body.profileId,
          location: body.location,
          budget: body.budget,
        },
        'Generating date suggestions'
      );

      try {
        // Verify that the profile belongs to the user
        const profile = await app.db.query.rosterProfiles.findFirst({
          where: and(
            eq(schema.rosterProfiles.id, body.profileId),
            eq(schema.rosterProfiles.userId, session.user.id)
          ),
        });

        if (!profile) {
          app.logger.warn({ userId: session.user.id, profileId: body.profileId }, 'Profile not found for date planning');
          return reply.status(404).send({ error: 'Profile not found' });
        }

        // Build the prompt for AI to generate real date suggestions
        const prompt = `Find 3-5 real, existing date ideas in ${body.location} with the following criteria:
- Budget: ${body.budget}
- Duration: ${body.duration}
${body.preferences ? `- Preferences: ${body.preferences}` : ''}

For each suggestion, provide:
1. The actual name of a real place/venue that exists
2. The type of activity (e.g., Restaurant, Bar, Activity, Museum, Park, etc.)
3. A brief description of what you'll do there
4. Why it's perfect for a date with this person
5. The actual, correct address of the place
6. The website URL if available
7. A Google Maps link to the place

Return results as JSON only with fields: name, type, description, estimatedCost, duration, whyPerfect, address, websiteUrl, googleMapsUrl`;

        app.logger.info(
          { userId: session.user.id, location: body.location },
          'Calling AI model for date suggestions'
        );

        // Call GPT-5.2 with structured output
        const result = await generateObject({
          model: gateway('openai/gpt-5.2'),
          schema: DateSuggestionSchema,
          prompt,
        });

        app.logger.info(
          {
            userId: session.user.id,
            profileId: body.profileId,
            count: result.object.suggestions.length,
          },
          'Date suggestions generated successfully'
        );

        return result.object;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, profileId: body.profileId, location: body.location },
          'Failed to generate date suggestions'
        );
        return reply.status(500).send({ error: 'Failed to generate date suggestions. Please try again.' });
      }
    }
  );
}
