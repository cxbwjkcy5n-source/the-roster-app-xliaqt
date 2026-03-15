import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerProfileRoutes(app: App, fastify: FastifyInstance) {
  // GET /api/user/profile - Get authenticated user's own profile
  fastify.get(
    '/api/user/profile',
    {
      schema: {
        description: 'Get user\'s own profile',
        tags: ['user'],
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
          app.logger.info({ userId }, 'User profile not found, returning empty object');
          return {};
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

  // PUT /api/user/profile - Upsert user's profile
  fastify.put(
    '/api/user/profile',
    {
      schema: {
        description: 'Update or create user\'s profile',
        tags: ['user'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            location: { type: 'string' },
            phoneNumber: { type: 'string' },
            favoriteColor: { type: 'string' },
            favoriteFoodType: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            notes: { type: 'string' },
            profileImageUrl: { type: 'string' },
            image: { type: 'string' },
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

        const body = request.body as Record<string, any>;
        const existingProfile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.userId, userId),
        });

        const profileImageUrl = body.profileImageUrl || body.image;

        if (existingProfile) {
          const updated = await app.db
            .update(schema.userProfiles)
            .set({
              name: body.name ?? existingProfile.name,
              age: body.age ?? existingProfile.age,
              location: body.location ?? existingProfile.location,
              phoneNumber: body.phoneNumber ?? existingProfile.phoneNumber,
              favoriteColor: body.favoriteColor ?? existingProfile.favoriteColor,
              favoriteFoodType: body.favoriteFoodType ?? existingProfile.favoriteFoodType,
              instagram: body.instagram ?? existingProfile.instagram,
              twitter: body.twitter ?? existingProfile.twitter,
              notes: body.notes ?? existingProfile.notes,
              profileImageUrl: profileImageUrl ?? existingProfile.profileImageUrl,
              updatedAt: new Date(),
            })
            .where(eq(schema.userProfiles.userId, userId))
            .returning();
          app.logger.info({ userId, profileId: existingProfile.id }, 'User profile updated successfully');
          return { success: true };
        } else {
          const created = await app.db
            .insert(schema.userProfiles)
            .values({
              userId,
              name: body.name,
              age: body.age,
              location: body.location,
              phoneNumber: body.phoneNumber,
              favoriteColor: body.favoriteColor,
              favoriteFoodType: body.favoriteFoodType,
              instagram: body.instagram,
              twitter: body.twitter,
              notes: body.notes,
              profileImageUrl,
            })
            .returning();
          app.logger.info({ userId, profileId: created[0].id }, 'User profile created successfully');
          return { success: true };
        }
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to upsert user profile');
        return reply.status(500).send({
          error: { message: 'Failed to upsert profile' },
        });
      }
    }
  );

  // POST /api/user/complete-profile - Mark user's first login as completed
  fastify.post(
    '/api/user/complete-profile',
    {
      schema: {
        description: 'Mark user\'s first login as completed',
        tags: ['user'],
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
      app.logger.info({ userId }, 'Completing user profile');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        app.logger.info({ userId }, 'User profile completed successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to complete user profile');
        return reply.status(500).send({
          error: { message: 'Failed to complete profile' },
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
          with: {
            flags: true,
          },
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
            age: { type: 'integer' },
            birthdayMonth: { type: 'string' },
            birthdayDay: { type: 'integer' },
            zodiacSign: { type: 'string' },
            favoriteColor: { type: 'string' },
            favoriteFood: { type: 'string' },
            relationshipType: { type: 'string' },
            customRelationshipType: { type: 'string' },
            howYouMet: { type: 'string' },
            location: { type: 'string' },
            phoneNumber: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            facebook: { type: 'string' },
            snapchat: { type: 'string' },
            notes: { type: 'string' },
            interestLevel: { type: 'string' },
            profileImageUrl: { type: 'string' },
            status: { type: 'string' },
            benchReason: { type: 'string' },
            sortOrder: { type: 'integer' },
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
            age: body.age,
            birthdayMonth: body.birthdayMonth,
            birthdayDay: body.birthdayDay,
            zodiacSign: body.zodiacSign,
            favoriteColor: body.favoriteColor,
            favoriteFood: body.favoriteFood,
            relationshipType: body.relationshipType,
            customRelationshipType: body.customRelationshipType,
            howYouMet: body.howYouMet,
            location: body.location,
            phoneNumber: body.phoneNumber,
            instagram: body.instagram,
            twitter: body.twitter,
            facebook: body.facebook,
            snapchat: body.snapchat,
            notes: body.notes,
            interestLevel: body.interestLevel,
            profileImageUrl: body.profileImageUrl,
            status: body.status,
            benchReason: body.benchReason,
            sortOrder: body.sortOrder,
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

  // GET /api/profiles/by-code - Look up a user by 6-character code
  fastify.get(
    '/api/profiles/by-code',
    {
      schema: {
        description: 'Look up a user by 6-character code',
        tags: ['profiles'],
        querystring: {
          type: 'object',
          properties: {
            code: { type: 'string' },
          },
          required: ['code'],
        },
        response: {
          200: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code } = request.query as { code: string };
      app.logger.info({ code }, 'Looking up user by code');

      try {
        const codeLower = code.toLowerCase();
        // Match against first 6 alphanumeric characters of user id
        const allUsers = await app.db.query.users.findMany();

        const user = allUsers.find((u: any) => u.id.substring(0, 6).toLowerCase() === codeLower);

        if (!user) {
          app.logger.warn({ code }, 'User not found by code');
          return reply.status(404).send({
            error: { message: 'User not found' },
          });
        }

        const profile = await app.db.query.rosterProfiles.findFirst({
          where: eq(schema.rosterProfiles.userId, (user as any).id),
        });

        app.logger.info({ code, userId: user.id }, 'User found by code');
        return profile || {};
      } catch (error) {
        app.logger.error({ err: error, code, message: String(error) }, 'Failed to look up user by code');
        return reply.status(500).send({
          error: { message: 'Failed to look up user' },
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
            id: { type: 'string' },
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
          with: {
            flags: true,
          },
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
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            birthdayMonth: { type: 'string' },
            birthdayDay: { type: 'integer' },
            zodiacSign: { type: 'string' },
            favoriteColor: { type: 'string' },
            favoriteFood: { type: 'string' },
            relationshipType: { type: 'string' },
            customRelationshipType: { type: 'string' },
            howYouMet: { type: 'string' },
            location: { type: 'string' },
            phoneNumber: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            facebook: { type: 'string' },
            snapchat: { type: 'string' },
            notes: { type: 'string' },
            interestLevel: { type: 'string' },
            profileImageUrl: { type: 'string' },
            status: { type: 'string' },
            benchReason: { type: 'string' },
            sortOrder: { type: 'integer' },
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
            age: body.age ?? profile.age,
            birthdayMonth: body.birthdayMonth ?? profile.birthdayMonth,
            birthdayDay: body.birthdayDay ?? profile.birthdayDay,
            zodiacSign: body.zodiacSign ?? profile.zodiacSign,
            favoriteColor: body.favoriteColor ?? profile.favoriteColor,
            favoriteFood: body.favoriteFood ?? profile.favoriteFood,
            relationshipType: body.relationshipType ?? profile.relationshipType,
            customRelationshipType: body.customRelationshipType ?? profile.customRelationshipType,
            howYouMet: body.howYouMet ?? profile.howYouMet,
            location: body.location ?? profile.location,
            phoneNumber: body.phoneNumber ?? profile.phoneNumber,
            instagram: body.instagram ?? profile.instagram,
            twitter: body.twitter ?? profile.twitter,
            facebook: body.facebook ?? profile.facebook,
            snapchat: body.snapchat ?? profile.snapchat,
            notes: body.notes ?? profile.notes,
            interestLevel: body.interestLevel ?? profile.interestLevel,
            profileImageUrl: body.profileImageUrl ?? profile.profileImageUrl,
            status: body.status ?? profile.status,
            benchReason: body.benchReason ?? profile.benchReason,
            sortOrder: body.sortOrder ?? profile.sortOrder,
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

  // PUT /api/profiles/:id/bench - Move profile to bench
  fastify.put(
    '/api/profiles/:id/bench',
    {
      schema: {
        description: 'Move profile to bench',
        tags: ['profiles'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            benchReason: { type: 'string' },
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
      const body = request.body as Record<string, any>;

      app.logger.info({ userId, profileId: id, benchReason: body.benchReason }, 'Moving profile to bench');

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

        const updated = await app.db
          .update(schema.rosterProfiles)
          .set({
            status: 'bench',
            benchReason: body.benchReason,
            updatedAt: new Date(),
          })
          .where(eq(schema.rosterProfiles.id, id))
          .returning();

        app.logger.info({ userId, profileId: id }, 'Profile moved to bench successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, userId, profileId: id, message: String(error) }, 'Failed to move profile to bench');
        return reply.status(500).send({
          error: { message: 'Failed to move profile to bench' },
        });
      }
    }
  );

  // PUT /api/profiles/:id/roster - Move profile back to roster
  fastify.put(
    '/api/profiles/:id/roster',
    {
      schema: {
        description: 'Move profile back to roster',
        tags: ['profiles'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
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

      app.logger.info({ userId, profileId: id }, 'Moving profile to roster');

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

        const updated = await app.db
          .update(schema.rosterProfiles)
          .set({
            status: 'roster',
            benchReason: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.rosterProfiles.id, id))
          .returning();

        app.logger.info({ userId, profileId: id }, 'Profile moved to roster successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, userId, profileId: id, message: String(error) }, 'Failed to move profile to roster');
        return reply.status(500).send({
          error: { message: 'Failed to move profile to roster' },
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
            id: { type: 'string' },
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

  // PUT /api/profiles/reorder - Reorder profiles
  fastify.put(
    '/api/profiles/reorder',
    {
      schema: {
        description: 'Reorder profiles',
        tags: ['profiles'],
        body: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sortOrder: { type: 'integer' },
            },
            required: ['id', 'sortOrder'],
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
      const updates = request.body as Array<{ id: string; sortOrder: number }>;

      app.logger.info({ userId, updateCount: updates.length }, 'Reordering profiles');

      try {
        for (const update of updates) {
          const profile = await app.db.query.rosterProfiles.findFirst({
            where: and(
              eq(schema.rosterProfiles.id, update.id),
              eq(schema.rosterProfiles.userId, userId)
            ),
          });

          if (!profile) {
            app.logger.warn({ userId, profileId: update.id }, 'Profile not found or unauthorized');
            return reply.status(404).send({
              error: { message: 'Profile not found' },
            });
          }

          await app.db
            .update(schema.rosterProfiles)
            .set({
              sortOrder: update.sortOrder,
              updatedAt: new Date(),
            })
            .where(eq(schema.rosterProfiles.id, update.id));
        }

        app.logger.info({ userId, updateCount: updates.length }, 'Profiles reordered successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to reorder profiles');
        return reply.status(500).send({
          error: { message: 'Failed to reorder profiles' },
        });
      }
    }
  );

  // POST /api/profiles/:id/flags - Add a flag to a profile
  fastify.post(
    '/api/profiles/:id/flags',
    {
      schema: {
        description: 'Add a flag to a profile',
        tags: ['flags'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            flagText: { type: 'string' },
            flagType: { type: 'string' },
          },
          required: ['flagText'],
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
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, any>;

      app.logger.info({ userId, profileId: id, flagText: body.flagText }, 'Adding flag to profile');

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

        const created = await app.db
          .insert(schema.profileFlags)
          .values({
            profileId: id,
            userId,
            flagText: body.flagText,
            flagType: body.flagType || 'red',
          })
          .returning();

        app.logger.info({ userId, flagId: created[0].id }, 'Flag added successfully');
        return reply.status(201).send(created[0]);
      } catch (error) {
        app.logger.error({ err: error, userId, profileId: id, message: String(error) }, 'Failed to add flag');
        return reply.status(500).send({
          error: { message: 'Failed to add flag' },
        });
      }
    }
  );

  // DELETE /api/flags/:id - Delete a flag
  fastify.delete(
    '/api/flags/:id',
    {
      schema: {
        description: 'Delete a flag',
        tags: ['flags'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
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

      app.logger.info({ userId, flagId: id }, 'Deleting flag');

      try {
        const flag = await app.db.query.profileFlags.findFirst({
          where: and(
            eq(schema.profileFlags.id, id),
            eq(schema.profileFlags.userId, userId)
          ),
        });

        if (!flag) {
          app.logger.warn({ userId, flagId: id }, 'Flag not found or unauthorized');
          return reply.status(404).send({
            error: { message: 'Flag not found' },
          });
        }

        await app.db
          .delete(schema.profileFlags)
          .where(eq(schema.profileFlags.id, id));

        app.logger.info({ userId, flagId: id }, 'Flag deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId, flagId: id, message: String(error) }, 'Failed to delete flag');
        return reply.status(500).send({
          error: { message: 'Failed to delete flag' },
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
          orderBy: desc(schema.dates.dateTime),
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
            dateTime: { type: 'string' },
            locationName: { type: 'string' },
            locationCoordinates: { type: 'string' },
            notes: { type: 'string' },
            status: { type: 'string' },
            type: { type: 'string' },
            rating: { type: 'integer' },
            wouldGoAgain: { type: 'boolean' },
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
            status: body.status || 'upcoming',
            type: body.type || 'casual',
            dateTime: body.dateTime ? new Date(body.dateTime) : null,
            location: body.locationName,
            locationCoords: body.locationCoordinates,
            notes: body.notes,
            rating: body.rating,
            wouldGoAgain: body.wouldGoAgain,
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
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            dateTime: { type: 'string' },
            locationName: { type: 'string' },
            locationCoordinates: { type: 'string' },
            notes: { type: 'string' },
            status: { type: 'string' },
            type: { type: 'string' },
            rating: { type: 'integer' },
            wouldGoAgain: { type: 'boolean' },
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

        const body = request.body as Record<string, any>;
        const updated = await app.db
          .update(schema.dates)
          .set({
            profileId: body.profileId ?? date.profileId,
            status: body.status ?? date.status,
            type: body.type ?? date.type,
            dateTime: body.dateTime ? new Date(body.dateTime) : date.dateTime,
            location: body.locationName ?? date.location,
            locationCoords: body.locationCoordinates ?? date.locationCoords,
            notes: body.notes ?? date.notes,
            rating: body.rating ?? date.rating,
            wouldGoAgain: body.wouldGoAgain ?? date.wouldGoAgain,
            updatedAt: new Date(),
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
            id: { type: 'string' },
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

  // GET /api/reminders - Get all reminders for user
  fastify.get(
    '/api/reminders',
    {
      schema: {
        description: 'Get all reminders for user',
        tags: ['reminders'],
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
      app.logger.info({ userId }, 'Fetching reminders');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        const reminders = await app.db.query.reminders.findMany({
          where: eq(schema.reminders.userId, userId),
        });

        app.logger.info({ userId, count: reminders.length }, 'Reminders retrieved successfully');
        return reminders;
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to fetch reminders');
        return reply.status(500).send({
          error: { message: 'Failed to fetch reminders' },
        });
      }
    }
  );

  // POST /api/reminders - Create a reminder
  fastify.post(
    '/api/reminders',
    {
      schema: {
        description: 'Create a reminder',
        tags: ['reminders'],
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            type: { type: 'string' },
            scheduledFor: { type: 'string' },
            message: { type: 'string' },
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
      app.logger.info({ userId, body: request.body }, 'Creating reminder');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        const body = request.body as Record<string, any>;
        const created = await app.db
          .insert(schema.reminders)
          .values({
            userId,
            profileId: body.profileId,
            type: body.type,
            scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
            message: body.message,
          })
          .returning();

        app.logger.info({ userId, reminderId: created[0].id }, 'Reminder created successfully');
        return reply.status(201).send(created[0]);
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to create reminder');
        return reply.status(500).send({
          error: { message: 'Failed to create reminder' },
        });
      }
    }
  );

  // PUT /api/reminders/:id - Update a reminder
  fastify.put(
    '/api/reminders/:id',
    {
      schema: {
        description: 'Update a reminder',
        tags: ['reminders'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            type: { type: 'string' },
            scheduledFor: { type: 'string' },
            message: { type: 'string' },
            sent: { type: 'boolean' },
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
      app.logger.info({ userId, reminderId: id, body: request.body }, 'Updating reminder');

      try {
        const reminder = await app.db.query.reminders.findFirst({
          where: and(
            eq(schema.reminders.id, id),
            eq(schema.reminders.userId, userId)
          ),
        });

        if (!reminder) {
          app.logger.warn({ userId, reminderId: id }, 'Reminder not found or unauthorized');
          return reply.status(404).send({
            error: { message: 'Reminder not found' },
          });
        }

        const body = request.body as Record<string, any>;
        const updated = await app.db
          .update(schema.reminders)
          .set({
            profileId: body.profileId ?? reminder.profileId,
            type: body.type ?? reminder.type,
            scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : reminder.scheduledFor,
            message: body.message ?? reminder.message,
            sent: body.sent ?? reminder.sent,
            updatedAt: new Date(),
          })
          .where(eq(schema.reminders.id, id))
          .returning();

        app.logger.info({ userId, reminderId: id }, 'Reminder updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, userId, reminderId: id, message: String(error) }, 'Failed to update reminder');
        return reply.status(500).send({
          error: { message: 'Failed to update reminder' },
        });
      }
    }
  );

  // DELETE /api/reminders/:id - Delete a reminder
  fastify.delete(
    '/api/reminders/:id',
    {
      schema: {
        description: 'Delete a reminder',
        tags: ['reminders'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
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

      app.logger.info({ userId, reminderId: id }, 'Deleting reminder');

      try {
        const reminder = await app.db.query.reminders.findFirst({
          where: and(
            eq(schema.reminders.id, id),
            eq(schema.reminders.userId, userId)
          ),
        });

        if (!reminder) {
          app.logger.warn({ userId, reminderId: id }, 'Reminder not found or unauthorized');
          return reply.status(404).send({
            error: { message: 'Reminder not found' },
          });
        }

        await app.db
          .delete(schema.reminders)
          .where(eq(schema.reminders.id, id));

        app.logger.info({ userId, reminderId: id }, 'Reminder deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId, reminderId: id, message: String(error) }, 'Failed to delete reminder');
        return reply.status(500).send({
          error: { message: 'Failed to delete reminder' },
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

        const profiles = await app.db.query.rosterProfiles.findMany({
          where: eq(schema.rosterProfiles.userId, userId),
        });

        const dates = await app.db.query.dates.findMany({
          where: eq(schema.dates.userId, userId),
        });

        const analytics = {
          totalProfiles: profiles.length,
          totalDates: dates.length,
          activeProfiles: profiles.filter(p => p.status === 'roster').length,
          benchedProfiles: profiles.filter(p => p.status === 'bench').length,
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

  // GET /api/nudges - Get nudge suggestions
  fastify.get(
    '/api/nudges',
    {
      schema: {
        description: 'Get nudge suggestions',
        tags: ['nudges'],
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
      app.logger.info({ userId }, 'Fetching nudges');

      try {
        await app.db.insert(schema.users).values({
          id: userId,
          email: session.user.email,
          name: session.user.name,
        }).onConflictDoNothing();

        app.logger.info({ userId }, 'Nudges retrieved successfully (empty)');
        return [];
      } catch (error) {
        app.logger.error({ err: error, userId, message: String(error) }, 'Failed to fetch nudges');
        return reply.status(500).send({
          error: { message: 'Failed to fetch nudges' },
        });
      }
    }
  );
}
