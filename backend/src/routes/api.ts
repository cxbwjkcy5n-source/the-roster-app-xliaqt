import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, isNull } from 'drizzle-orm';
import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerProfileRoutes(app: App, fastify: FastifyInstance) {
  // GET /api/profile - Get user's own profile
  fastify.get(
    '/api/profile',
    {
      schema: {
        description: 'Get user\'s own profile',
        tags: ['profile'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              name: { type: 'string' },
              age: { type: 'integer' },
              phone: { type: 'string' },
              favoriteColor: { type: 'string' },
              favoriteFood: { type: 'string' },
              instagram: { type: 'string' },
              twitter: { type: 'string' },
              notes: { type: 'string' },
              photoUrl: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching user profile');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        const profile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.userId, userId),
        });

        if (!profile) {
          app.logger.info({ userId }, 'User profile not found');
          return reply.status(404).send({
            error: { message: 'Profile not found' },
          });
        }

        app.logger.info({ userId, profileId: profile.id }, 'User profile retrieved successfully');
        return profile;
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to fetch user profile');
        return reply.status(500).send({
          error: { message: 'Failed to fetch profile' },
        });
      }
    }
  );

  // PUT /api/profile - Upsert user's profile
  fastify.put(
    '/api/profile',
    {
      schema: {
        description: 'Update or create user\'s profile',
        tags: ['profile'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            phone: { type: 'string' },
            favoriteColor: { type: 'string' },
            favoriteFood: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            notes: { type: 'string' },
            photoUrl: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId, body: request.body }, 'Upserting user profile');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        const existingProfile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.userId, userId),
        });

        let profile;
        if (existingProfile) {
          const body = request.body as Record<string, any>;
          const updated = await app.db
            .update(schema.userProfiles)
            .set({
              name: body.name,
              age: body.age,
              phone: body.phone,
              favoriteColor: body.favoriteColor,
              favoriteFood: body.favoriteFood,
              instagram: body.instagram,
              twitter: body.twitter,
              notes: body.notes,
              photoUrl: body.photoUrl,
              updatedAt: new Date(),
            })
            .where(eq(schema.userProfiles.userId, userId))
            .returning();
          profile = updated[0];
        } else {
          const body = request.body as Record<string, any>;
          const created = await app.db
            .insert(schema.userProfiles)
            .values({
              userId,
              name: body.name,
              age: body.age,
              phone: body.phone,
              favoriteColor: body.favoriteColor,
              favoriteFood: body.favoriteFood,
              instagram: body.instagram,
              twitter: body.twitter,
              notes: body.notes,
              photoUrl: body.photoUrl,
            })
            .returning();
          profile = created[0];
        }

        app.logger.info({ userId, profileId: profile.id }, 'User profile upserted successfully');
        return profile;
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to upsert user profile');
        return reply.status(500).send({
          error: { message: 'Failed to upsert profile' },
        });
      }
    }
  );

  // GET /api/profiles - Get all roster profiles for user
  fastify.get(
    '/api/profiles',
    {
      schema: {
        description: 'Get all roster profiles for user',
        tags: ['profiles'],
        response: {
          200: {
            type: 'array',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching roster profiles');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        const profiles = await app.db.query.rosterProfiles.findMany({
          where: eq(schema.rosterProfiles.userId, userId),
          orderBy: desc(schema.rosterProfiles.createdAt),
        });

        app.logger.info({ userId, count: profiles.length }, 'Roster profiles retrieved successfully');
        return profiles;
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to fetch roster profiles');
        return reply.status(500).send({
          error: { message: 'Failed to fetch profiles' },
        });
      }
    }
  );

  // POST /api/profiles - Create new roster profile
  fastify.post(
    '/api/profiles',
    {
      schema: {
        description: 'Create a new roster profile',
        tags: ['profiles'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            location: { type: 'string' },
            age: { type: 'integer' },
            birthdayMonth: { type: 'string' },
            birthdayDay: { type: 'integer' },
            zodiacSign: { type: 'string' },
            favoriteFood: { type: 'string' },
            relationshipType: { type: 'string' },
            howWeMet: { type: 'string' },
            phone: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            notes: { type: 'string' },
            photoUrl: { type: 'string' },
            priority: { type: 'string' },
            status: { type: 'string' },
          },
          required: ['name'],
        },
        response: {
          201: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId, body: request.body }, 'Creating roster profile');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        const body = request.body as Record<string, any>;
        const created = await app.db
          .insert(schema.rosterProfiles)
          .values({
            userId,
            name: body.name,
            location: body.location,
            age: body.age,
            birthdayMonth: body.birthdayMonth,
            birthdayDay: body.birthdayDay,
            zodiacSign: body.zodiacSign,
            favoriteFood: body.favoriteFood,
            relationshipType: body.relationshipType,
            howWeMet: body.howWeMet,
            phone: body.phone,
            instagram: body.instagram,
            twitter: body.twitter,
            notes: body.notes,
            photoUrl: body.photoUrl,
            priority: body.priority,
            status: body.status,
          })
          .returning();

        app.logger.info({ userId, profileId: created[0].id }, 'Roster profile created successfully');
        return reply.status(201).send(created[0]);
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to create roster profile');
        return reply.status(500).send({
          error: { message: 'Failed to create profile' },
        });
      }
    }
  );

  // GET /api/profiles/:id - Get single roster profile
  fastify.get(
    '/api/profiles/:id',
    {
      schema: {
        description: 'Get a single roster profile by ID',
        tags: ['profiles'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params as { id: string };
      app.logger.info({ userId, profileId: id }, 'Fetching roster profile');

      try {
        const profile = await app.db.query.rosterProfiles.findFirst({
          where: and(
            eq(schema.rosterProfiles.id, id),
            eq(schema.rosterProfiles.userId, userId)
          ),
        });

        if (!profile) {
          app.logger.warn({ userId, profileId: id }, 'Profile not found or unauthorized');
          return reply.status(404).send({
            error: { message: 'Profile not found' },
          });
        }

        app.logger.info({ userId, profileId: id }, 'Roster profile retrieved successfully');
        return profile;
      } catch (error) {
        app.logger.error({ err: error, userId, profileId: id, message: String(error) }, 'Failed to fetch roster profile');
        return reply.status(500).send({
          error: { message: 'Failed to fetch profile' },
        });
      }
    }
  );

  // PUT /api/profiles/:id - Update roster profile
  fastify.put(
    '/api/profiles/:id',
    {
      schema: {
        description: 'Update a roster profile',
        tags: ['profiles'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            location: { type: 'string' },
            age: { type: 'integer' },
            birthdayMonth: { type: 'string' },
            birthdayDay: { type: 'integer' },
            zodiacSign: { type: 'string' },
            favoriteFood: { type: 'string' },
            relationshipType: { type: 'string' },
            howWeMet: { type: 'string' },
            phone: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            notes: { type: 'string' },
            photoUrl: { type: 'string' },
            priority: { type: 'string' },
            status: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params as { id: string };
      app.logger.info({ userId, profileId: id, body: request.body }, 'Updating roster profile');

      try {
        const profile = await app.db.query.rosterProfiles.findFirst({
          where: and(
            eq(schema.rosterProfiles.id, id),
            eq(schema.rosterProfiles.userId, userId)
          ),
        });

        if (!profile) {
          app.logger.warn({ userId, profileId: id }, 'Profile not found or unauthorized');
          return reply.status(404).send({
            error: { message: 'Profile not found' },
          });
        }

        const body = request.body as Record<string, any>;
        const updated = await app.db
          .update(schema.rosterProfiles)
          .set({
            name: body.name ?? profile.name,
            location: body.location ?? profile.location,
            age: body.age ?? profile.age,
            birthdayMonth: body.birthdayMonth ?? profile.birthdayMonth,
            birthdayDay: body.birthdayDay ?? profile.birthdayDay,
            zodiacSign: body.zodiacSign ?? profile.zodiacSign,
            favoriteFood: body.favoriteFood ?? profile.favoriteFood,
            relationshipType: body.relationshipType ?? profile.relationshipType,
            howWeMet: body.howWeMet ?? profile.howWeMet,
            phone: body.phone ?? profile.phone,
            instagram: body.instagram ?? profile.instagram,
            twitter: body.twitter ?? profile.twitter,
            notes: body.notes ?? profile.notes,
            photoUrl: body.photoUrl ?? profile.photoUrl,
            priority: body.priority ?? profile.priority,
            status: body.status ?? profile.status,
            updatedAt: new Date(),
          })
          .where(eq(schema.rosterProfiles.id, id))
          .returning();

        app.logger.info({ userId, profileId: id }, 'Roster profile updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, userId, profileId: id, message: String(error) }, 'Failed to update roster profile');
        return reply.status(500).send({
          error: { message: 'Failed to update profile' },
        });
      }
    }
  );

  // DELETE /api/profiles/:id - Delete roster profile
  fastify.delete(
    '/api/profiles/:id',
    {
      schema: {
        description: 'Delete a roster profile',
        tags: ['profiles'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          204: {
            type: 'null',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params as { id: string };
      app.logger.info({ userId, profileId: id }, 'Deleting roster profile');

      try {
        const profile = await app.db.query.rosterProfiles.findFirst({
          where: and(
            eq(schema.rosterProfiles.id, id),
            eq(schema.rosterProfiles.userId, userId)
          ),
        });

        if (!profile) {
          app.logger.warn({ userId, profileId: id }, 'Profile not found or unauthorized');
          return reply.status(404).send({
            error: { message: 'Profile not found' },
          });
        }

        await app.db
          .delete(schema.rosterProfiles)
          .where(eq(schema.rosterProfiles.id, id));

        app.logger.info({ userId, profileId: id }, 'Roster profile deleted successfully');
        return reply.status(204).send();
      } catch (error) {
        app.logger.error({ err: error, userId, profileId: id, message: String(error) }, 'Failed to delete roster profile');
        return reply.status(500).send({
          error: { message: 'Failed to delete profile' },
        });
      }
    }
  );

  // GET /api/dates - Get all dates for user
  fastify.get(
    '/api/dates',
    {
      schema: {
        description: 'Get all dates for user',
        tags: ['dates'],
        response: {
          200: {
            type: 'array',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching dates');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        const dates = await app.db.query.dates.findMany({
          where: eq(schema.dates.userId, userId),
          orderBy: [
            desc(schema.dates.dateTime),
          ],
        });

        app.logger.info({ userId, count: dates.length }, 'Dates retrieved successfully');
        return dates;
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to fetch dates');
        return reply.status(500).send({
          error: { message: 'Failed to fetch dates' },
        });
      }
    }
  );

  // POST /api/dates - Create new date
  fastify.post(
    '/api/dates',
    {
      schema: {
        description: 'Create a new date',
        tags: ['dates'],
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            status: { type: 'string' },
            type: { type: 'string' },
            dateTime: { type: 'string' },
            locationName: { type: 'string' },
            locationAddress: { type: 'string' },
            locationCoordinates: { type: 'string' },
            notes: { type: 'string' },
            rating: { type: 'integer' },
            wouldGoAgain: { type: 'boolean' },
            reminderSettings: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId, body: request.body }, 'Creating date');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        const body = request.body as Record<string, any>;
        const created = await app.db
          .insert(schema.dates)
          .values({
            userId,
            profileId: body.profileId,
            status: body.status,
            type: body.type,
            dateTime: body.dateTime ? new Date(body.dateTime) : null,
            locationName: body.locationName,
            locationAddress: body.locationAddress,
            locationCoordinates: body.locationCoordinates,
            notes: body.notes,
            rating: body.rating,
            wouldGoAgain: body.wouldGoAgain,
            reminderSettings: body.reminderSettings,
          })
          .returning();

        app.logger.info({ userId, dateId: created[0].id }, 'Date created successfully');
        return reply.status(201).send(created[0]);
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to create date');
        return reply.status(500).send({
          error: { message: 'Failed to create date' },
        });
      }
    }
  );

  // PUT /api/dates/:id - Update date
  fastify.put(
    '/api/dates/:id',
    {
      schema: {
        description: 'Update a date',
        tags: ['dates'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            status: { type: 'string' },
            type: { type: 'string' },
            dateTime: { type: 'string' },
            locationName: { type: 'string' },
            locationAddress: { type: 'string' },
            locationCoordinates: { type: 'string' },
            notes: { type: 'string' },
            rating: { type: 'integer' },
            wouldGoAgain: { type: 'boolean' },
            reminderSettings: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params as { id: string };
      app.logger.info({ userId, dateId: id, body: request.body }, 'Updating date');

      try {
        const date = await app.db.query.dates.findFirst({
          where: and(
            eq(schema.dates.id, id),
            eq(schema.dates.userId, userId)
          ),
        });

        if (!date) {
          app.logger.warn({ userId, dateId: id }, 'Date not found or unauthorized');
          return reply.status(404).send({
            error: { message: 'Date not found' },
          });
        }

        const body = request.body as any;
        const updated = await app.db
          .update(schema.dates)
          .set({
            profileId: body.profileId ?? date.profileId,
            status: body.status ?? date.status,
            type: body.type ?? date.type,
            dateTime: body.dateTime ? new Date(body.dateTime) : date.dateTime,
            locationName: body.locationName ?? date.locationName,
            locationAddress: body.locationAddress ?? date.locationAddress,
            locationCoordinates: body.locationCoordinates ?? date.locationCoordinates,
            notes: body.notes ?? date.notes,
            rating: body.rating ?? date.rating,
            wouldGoAgain: body.wouldGoAgain ?? date.wouldGoAgain,
            reminderSettings: body.reminderSettings ?? date.reminderSettings,
          })
          .where(eq(schema.dates.id, id))
          .returning();

        app.logger.info({ userId, dateId: id }, 'Date updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, userId, dateId: id, message: String(error) }, 'Failed to update date');
        return reply.status(500).send({
          error: { message: 'Failed to update date' },
        });
      }
    }
  );

  // DELETE /api/dates/:id - Delete date
  fastify.delete(
    '/api/dates/:id',
    {
      schema: {
        description: 'Delete a date',
        tags: ['dates'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          204: {
            type: 'null',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params as { id: string };
      app.logger.info({ userId, dateId: id }, 'Deleting date');

      try {
        const date = await app.db.query.dates.findFirst({
          where: and(
            eq(schema.dates.id, id),
            eq(schema.dates.userId, userId)
          ),
        });

        if (!date) {
          app.logger.warn({ userId, dateId: id }, 'Date not found or unauthorized');
          return reply.status(404).send({
            error: { message: 'Date not found' },
          });
        }

        await app.db
          .delete(schema.dates)
          .where(eq(schema.dates.id, id));

        app.logger.info({ userId, dateId: id }, 'Date deleted successfully');
        return reply.status(204).send();
      } catch (error) {
        app.logger.error({ err: error, userId, dateId: id, message: String(error) }, 'Failed to delete date');
        return reply.status(500).send({
          error: { message: 'Failed to delete date' },
        });
      }
    }
  );

  // GET /api/analytics - Get analytics data
  fastify.get(
    '/api/analytics',
    {
      schema: {
        description: 'Get analytics data',
        tags: ['analytics'],
        response: {
          200: {
            type: 'object',
            properties: {
              total_roster: { type: 'integer' },
              total_dates: { type: 'integer' },
              active_roster: { type: 'integer' },
              this_month_dates: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching analytics');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        // Total roster profiles
        const totalRoster = await app.db.query.rosterProfiles.findMany({
          where: eq(schema.rosterProfiles.userId, userId),
        });

        // Total dates
        const totalDates = await app.db.query.dates.findMany({
          where: eq(schema.dates.userId, userId),
        });

        // Active roster (status = 'active')
        const activeRoster = await app.db.query.rosterProfiles.findMany({
          where: and(
            eq(schema.rosterProfiles.userId, userId),
            eq(schema.rosterProfiles.status, 'active')
          ),
        });

        // This month's dates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const thisMonthDates = await app.db.query.dates.findMany({
          where: and(
            eq(schema.dates.userId, userId),
          ),
        });

        const thisMonthCount = thisMonthDates.filter(d => {
          if (!d.dateTime) return false;
          return d.dateTime >= startOfMonth && d.dateTime <= endOfMonth;
        }).length;

        const analytics = {
          total_roster: totalRoster.length,
          total_dates: totalDates.length,
          active_roster: activeRoster.length,
          this_month_dates: thisMonthCount,
        };

        app.logger.info({ userId, analytics }, 'Analytics retrieved successfully');
        return analytics;
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to fetch analytics');
        return reply.status(500).send({
          error: { message: 'Failed to fetch analytics' },
        });
      }
    }
  );
}
