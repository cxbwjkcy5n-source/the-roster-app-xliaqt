import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, count, sql, desc, and } from 'drizzle-orm';
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

      // Dates per month (last 12 months)
      const datesPerMonth: Array<{ month: number; year: number; count: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const [monthResult] = await app.db
          .select({ value: count() })
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              sql`EXTRACT(YEAR FROM ${schema.dates.createdAt}) = ${year}`,
              sql`EXTRACT(MONTH FROM ${schema.dates.createdAt}) = ${month}`
            )
          );

        datesPerMonth.push({
          month,
          year,
          count: monthResult?.value || 0,
        });
      }

      // Common red flags
      const redFlagsData = await app.db
        .select({
          text: schema.redFlags.flagText,
          count: count(),
        })
        .from(schema.redFlags)
        .innerJoin(schema.rosterProfiles, eq(schema.redFlags.profileId, schema.rosterProfiles.id))
        .where(eq(schema.rosterProfiles.userId, session.user.id))
        .groupBy(schema.redFlags.flagText)
        .orderBy(desc(count()))
        .limit(10);

      // Common green flags
      const greenFlagsData = await app.db
        .select({
          text: schema.greenFlags.flagText,
          count: count(),
        })
        .from(schema.greenFlags)
        .innerJoin(schema.rosterProfiles, eq(schema.greenFlags.profileId, schema.rosterProfiles.id))
        .where(eq(schema.rosterProfiles.userId, session.user.id))
        .groupBy(schema.greenFlags.flagText)
        .orderBy(desc(count()))
        .limit(10);

      // Most active profiles (by interaction count)
      const mostActiveData = await app.db
        .select({
          profileId: schema.interactions.profileId,
          profileName: schema.rosterProfiles.name,
          interactionCount: count().as('interactionCount'),
        })
        .from(schema.interactions)
        .innerJoin(schema.rosterProfiles, eq(schema.interactions.profileId, schema.rosterProfiles.id))
        .where(eq(schema.interactions.userId, session.user.id))
        .groupBy(schema.interactions.profileId, schema.rosterProfiles.name)
        .orderBy(desc(count()))
        .limit(5);

      // Calculate average days between dates
      let dateFrequency = 0;
      if (completedDates > 1) {
        const datesList = await app.db
          .select({ createdAt: schema.dates.createdAt })
          .from(schema.dates)
          .where(and(eq(schema.dates.userId, session.user.id), eq(schema.dates.status, 'completed')))
          .orderBy(schema.dates.createdAt);

        if (datesList.length > 1) {
          let totalDays = 0;
          for (let i = 1; i < datesList.length; i++) {
            const daysDiff =
              (datesList[i].createdAt.getTime() - datesList[i - 1].createdAt.getTime()) /
              (1000 * 60 * 60 * 24);
            totalDays += daysDiff;
          }
          dateFrequency = Math.round(totalDays / (datesList.length - 1));
        }
      }

      return {
        totalProfiles,
        totalDates,
        upcomingDates,
        completedDates,
        interestLevelBreakdown,
        statusBreakdown,
        datesPerMonth,
        commonRedFlags: redFlagsData.map((r: any) => ({
          text: r.text,
          count: r.count,
        })),
        commonGreenFlags: greenFlagsData.map((g: any) => ({
          text: g.text,
          count: g.count,
        })),
        dateFrequency,
        mostActiveProfiles: mostActiveData.map((m: any) => ({
          profileId: m.profileId,
          profileName: m.profileName,
          interactionCount: m.interactionCount,
        })),
      };
    }
  );
}
