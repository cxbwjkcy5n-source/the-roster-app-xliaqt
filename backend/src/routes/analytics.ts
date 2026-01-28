import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, count, sql, desc, and, gt, isNotNull, avg } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerAnalyticsRoutes(app: App, fastify: FastifyInstance) {

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
              dateFrequency: {
                type: 'object',
                properties: {
                  thisWeek: { type: 'integer' },
                  thisMonth: { type: 'integer' },
                  lastMonth: { type: 'integer' },
                },
              },
              datesPerMonth: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    month: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
              averageRating: { type: 'number' },
              totalRatings: { type: 'integer' },
              wouldGoAgainPercentage: { type: 'number' },
              commonRedFlags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    flag: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
              commonGreenFlags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    flag: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
              topRatedDates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    profileName: { type: 'string' },
                    type: { type: 'string' },
                    rating: { type: 'integer' },
                    date: { type: 'string' },
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

      app.logger.info({ userId: session.user.id }, 'Fetching analytics');

      try {
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
            and(
              eq(schema.dates.status, 'upcoming'),
              eq(schema.dates.userId, session.user.id)
            )
          );

        const upcomingDates = upcomingDatesResult?.value || 0;

        // Completed dates
        const [completedDatesResult] = await app.db
          .select({ value: count() })
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.status, 'completed'),
              eq(schema.dates.userId, session.user.id)
            )
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

        // Date frequency (this week, this month, last month)
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const [thisWeekResult] = await app.db
          .select({ value: count() })
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              eq(schema.dates.status, 'completed'),
              sql`${schema.dates.createdAt} >= ${oneWeekAgo}`
            )
          );

        const [thisMonthResult] = await app.db
          .select({ value: count() })
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              eq(schema.dates.status, 'completed'),
              sql`${schema.dates.createdAt} >= ${oneMonthAgo}`
            )
          );

        const [lastMonthResult] = await app.db
          .select({ value: count() })
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              eq(schema.dates.status, 'completed'),
              sql`${schema.dates.createdAt} >= ${twoMonthsAgo} AND ${schema.dates.createdAt} < ${oneMonthAgo}`
            )
          );

        // Dates per month (last 6 months)
        const datesPerMonth: Array<{ month: string; count: number }> = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });

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
            month: monthName,
            count: monthResult?.value || 0,
          });
        }

        // Average rating and total ratings
        const [ratingResult] = await app.db
          .select({
            averageRating: avg(schema.dates.rating),
            totalRatings: count(),
          })
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              isNotNull(schema.dates.rating)
            )
          );

        const averageRating = ratingResult?.averageRating ? Math.round(parseFloat(ratingResult.averageRating.toString()) * 10) / 10 : 0;
        const totalRatings = ratingResult?.totalRatings || 0;

        // Would go again percentage
        const [wouldGoAgainResult] = await app.db
          .select({ value: count() })
          .from(schema.dates)
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              eq(schema.dates.wouldGoAgain, true)
            )
          );

        const wouldGoAgainCount = wouldGoAgainResult?.value || 0;
        const wouldGoAgainPercentage = totalRatings > 0 ? Math.round((wouldGoAgainCount / totalRatings) * 100) : 0;

        // Common red flags (top 5)
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
          .limit(5);

        // Common green flags (top 5)
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
          .limit(5);

        // Top rated dates
        const topRatedDates = await app.db
          .select({
            id: schema.dates.id,
            profileName: schema.rosterProfiles.name,
            type: schema.dates.type,
            rating: schema.dates.rating,
            createdAt: schema.dates.createdAt,
          })
          .from(schema.dates)
          .innerJoin(schema.rosterProfiles, eq(schema.dates.profileId, schema.rosterProfiles.id))
          .where(
            and(
              eq(schema.dates.userId, session.user.id),
              isNotNull(schema.dates.rating),
              gt(schema.dates.rating, 0)
            )
          )
          .orderBy(desc(schema.dates.rating), desc(schema.dates.createdAt))
          .limit(5);

        app.logger.info(
          {
            userId: session.user.id,
            totalProfiles,
            totalDates,
            completedDates,
          },
          'Analytics fetched successfully'
        );

        return {
          totalProfiles,
          totalDates,
          upcomingDates,
          completedDates,
          interestLevelBreakdown,
          statusBreakdown,
          dateFrequency: {
            thisWeek: thisWeekResult?.value || 0,
            thisMonth: thisMonthResult?.value || 0,
            lastMonth: lastMonthResult?.value || 0,
          },
          datesPerMonth,
          averageRating,
          totalRatings,
          wouldGoAgainPercentage,
          commonRedFlags: redFlagsData.map((r: any) => ({
            flag: r.text,
            count: r.count,
          })),
          commonGreenFlags: greenFlagsData.map((g: any) => ({
            flag: g.text,
            count: g.count,
          })),
          topRatedDates: topRatedDates.map((d: any) => ({
            id: d.id,
            profileName: d.profileName,
            type: d.type,
            rating: d.rating,
            date: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '',
          })),
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch analytics');
        return reply.status(500).send({ error: 'Failed to fetch analytics. Please try again.' });
      }
    }
  );
}
