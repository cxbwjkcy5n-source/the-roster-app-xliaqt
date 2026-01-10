import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerAnalyticsRoutes(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // Get analytics for authenticated user
  fastify.get(
    '/api/analytics',
    {
      schema: {
        description: 'Get dating analytics for the authenticated user',
        tags: ['analytics'],
        response: {
          200: {
            type: 'object',
            properties: {
              totalProfiles: { type: 'integer' },
              totalDates: { type: 'integer' },
              upcomingDates: { type: 'integer' },
              completedDates: { type: 'integer' },
              interestLevelBreakdown: {
                type: 'object',
                properties: {
                  low: { type: 'integer' },
                  medium: { type: 'integer' },
                  high: { type: 'integer' },
                },
              },
              statusBreakdown: {
                type: 'object',
                properties: {
                  roster: { type: 'integer' },
                  bench: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Total profiles
      const [totalProfilesResult] = await app.db
        .select({ value: count() })
        .from(schema.rosterProfiles)
        .where(eq(schema.rosterProfiles.userId, session.user.id));

      const totalProfiles = totalProfilesResult?.value || 0;

      // Total dates
      const [totalDatesResult] = await app.db
        .select({ value: count() })
        .from(schema.dates)
        .where(eq(schema.dates.userId, session.user.id));

      const totalDates = totalDatesResult?.value || 0;

      // Upcoming dates
      const [upcomingDatesResult] = await app.db
        .select({ value: count() })
        .from(schema.dates)
        .where(
          eq(schema.dates.status, 'upcoming') && eq(schema.dates.userId, session.user.id)
        );

      const upcomingDates = upcomingDatesResult?.value || 0;

      // Completed dates
      const [completedDatesResult] = await app.db
        .select({ value: count() })
        .from(schema.dates)
        .where(
          eq(schema.dates.status, 'completed') && eq(schema.dates.userId, session.user.id)
        );

      const completedDates = completedDatesResult?.value || 0;

      // Interest level breakdown
      const profiles = await app.db
        .select()
        .from(schema.rosterProfiles)
        .where(eq(schema.rosterProfiles.userId, session.user.id));

      const interestLevelBreakdown = {
        low: 0,
        medium: 0,
        high: 0,
      };

      profiles.forEach((profile) => {
        const level = (profile.interestLevel as 'low' | 'medium' | 'high') || 'medium';
        interestLevelBreakdown[level] = (interestLevelBreakdown[level] || 0) + 1;
      });

      // Status breakdown
      const statusBreakdown = {
        roster: 0,
        bench: 0,
      };

      profiles.forEach((profile) => {
        const status = (profile.status as 'roster' | 'bench') || 'roster';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });

      return {
        totalProfiles,
        totalDates,
        upcomingDates,
        completedDates,
        interestLevelBreakdown,
        statusBreakdown,
      };
    }
  );
}
