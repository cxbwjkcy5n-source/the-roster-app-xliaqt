import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerProfileRoutes(app: App, fastify: FastifyInstance) {

  // Create new profile
  fastify.post<{ Body: { name: string; [key: string]: any } }>(
    '/api/profiles',
    {
      schema: {
        description: 'Create a new profile',
        tags: ['profiles'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            birthdayMonth: { type: 'integer' },
            birthdayDay: { type: 'integer' },
            birthdayYear: { type: 'integer' },
            zodiacSign: { type: 'string' },
            favoriteColor: { type: 'string' },
            favoriteFood: { type: 'string' },
            relationshipType: { type: 'string' },
            location: { type: 'string' },
            phoneNumber: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            facebook: { type: 'string' },
            snapchat: { type: 'string' },
            notes: { type: 'string' },
            hobbies: { type: 'string' },
            interests: { type: 'string' },
            howYouMet: { type: 'string' },
            interestLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            profileImageUrl: { type: 'string' },
            profileImageKey: { type: 'string' },
            status: { type: 'string', enum: ['roster', 'bench'] },
            benchReason: { type: 'string' },
          },
          required: ['name'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as { name: string; [key: string]: any };
      app.logger.info({ userId: session.user.id, name: body.name }, 'Creating new profile');

      const [profile] = await app.db
        .insert(schema.rosterProfiles)
        .values({
          name: body.name,
          userId: session.user.id,
          age: body.age,
          birthdayMonth: body.birthdayMonth,
          birthdayDay: body.birthdayDay,
          birthdayYear: body.birthdayYear,
          zodiacSign: body.zodiacSign,
          favoriteColor: body.favoriteColor,
          favoriteFood: body.favoriteFood,
          relationshipType: body.relationshipType,
          location: body.location,
          phoneNumber: body.phoneNumber,
          instagram: body.instagram,
          twitter: body.twitter,
          facebook: body.facebook,
          snapchat: body.snapchat,
          notes: body.notes,
          hobbies: body.hobbies,
          interests: body.interests,
          howYouMet: body.howYouMet,
          interestLevel: body.interestLevel,
          profileImageUrl: body.profileImageUrl,
          profileImageKey: body.profileImageKey,
          status: body.status,
          benchReason: body.benchReason,
        })
        .returning();

      app.logger.info({ profileId: profile.id, userId: session.user.id }, 'Profile created successfully');
      return profile;
    }
  );

  // Get all profiles for authenticated user
  fastify.get(
    '/api/profiles',
    {
      schema: {
        description: 'Get all profiles for the authenticated user',
        tags: ['profiles'],
        response: { 200: { type: 'array' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching all profiles');

      const profiles = await app.db.query.rosterProfiles.findMany({
        where: eq(schema.rosterProfiles.userId, session.user.id),
        with: {
          redFlags: true,
          greenFlags: true,
          dates: true,
        },
      });

      app.logger.info({ userId: session.user.id, count: profiles.length }, 'Profiles fetched successfully');
      return profiles;
    }
  );

  // Get single profile
  fastify.get<{ Params: { id: string } }>(
    '/api/profiles/:id',
    {
      schema: {
        description: 'Get a single profile',
        tags: ['profiles'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, profileId: id }, 'Fetching profile');

      const profile = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
        with: {
          redFlags: true,
          greenFlags: true,
          dates: true,
        },
      });

      if (!profile) {
        app.logger.warn({ userId: session.user.id, profileId: id }, 'Profile not found');
        return reply.status(404).send({ error: 'Profile not found' });
      }

      app.logger.info({ userId: session.user.id, profileId: id }, 'Profile fetched successfully');
      return profile;
    }
  );

  // Update profile
  fastify.put<{ Params: { id: string }; Body: { [key: string]: any } }>(
    '/api/profiles/:id',
    {
      schema: {
        description: 'Update a profile',
        tags: ['profiles'],
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

      app.logger.info({ userId: session.user.id, profileId: id }, 'Updating profile');

      // Verify ownership
      const existing = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!existing) {
        app.logger.warn({ userId: session.user.id, profileId: id }, 'Profile not found for update');
        return reply.status(404).send({ error: 'Profile not found' });
      }

      const updateData: Record<string, any> = { ...body, updatedAt: new Date() };

      const [updated] = await app.db
        .update(schema.rosterProfiles)
        .set(updateData)
        .where(eq(schema.rosterProfiles.id, id))
        .returning();

      app.logger.info({ userId: session.user.id, profileId: id }, 'Profile updated successfully');
      return updated;
    }
  );

  // Delete profile
  fastify.delete<{ Params: { id: string } }>(
    '/api/profiles/:id',
    {
      schema: {
        description: 'Delete a profile',
        tags: ['profiles'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };

      // Verify ownership
      const existing = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      const [deleted] = await app.db
        .delete(schema.rosterProfiles)
        .where(eq(schema.rosterProfiles.id, id))
        .returning();

      return deleted;
    }
  );

  // Move profile to bench
  fastify.put<{ Params: { id: string }; Body: { reason?: string } }>(
    '/api/profiles/:id/bench',
    {
      schema: {
        description: 'Move a profile to bench',
        tags: ['profiles'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
          },
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as { reason?: string };

      // Verify ownership
      const existing = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      const [updated] = await app.db
        .update(schema.rosterProfiles)
        .set({
          status: 'bench',
          benchReason: body.reason,
          updatedAt: new Date(),
        })
        .where(eq(schema.rosterProfiles.id, id))
        .returning();

      return updated;
    }
  );

  // Move profile back to roster
  fastify.put<{ Params: { id: string } }>(
    '/api/profiles/:id/roster',
    {
      schema: {
        description: 'Move a profile back to roster',
        tags: ['profiles'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };

      // Verify ownership
      const existing = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      const [updated] = await app.db
        .update(schema.rosterProfiles)
        .set({
          status: 'roster',
          benchReason: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.rosterProfiles.id, id))
        .returning();

      return updated;
    }
  );

  // Add flag to profile (red or green)
  fastify.post<{
    Params: { id: string };
    Body: { flagText: string; type: 'red' | 'green' };
  }>(
    '/api/profiles/:id/flags',
    {
      schema: {
        description: 'Add a red or green flag to a profile',
        tags: ['profiles'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: {
          type: 'object',
          properties: {
            flagText: { type: 'string' },
            type: { type: 'string', enum: ['red', 'green'] },
          },
          required: ['flagText', 'type'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };
      const { flagText, type } = request.body as { flagText: string; type: 'red' | 'green' };

      // Verify ownership
      const profile = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!profile) {
        return reply.status(404).send({ error: 'Profile not found' });
      }

      if (type === 'red') {
        const [flag] = await app.db
          .insert(schema.redFlags)
          .values({ profileId: id, flagText })
          .returning();
        return flag;
      } else {
        const [flag] = await app.db
          .insert(schema.greenFlags)
          .values({ profileId: id, flagText })
          .returning();
        return flag;
      }
    }
  );

  // Bulk update display order (for drag-to-reorder)
  fastify.put<{
    Body: { profiles: Array<{ id: string; displayOrder: number }> };
  }>(
    '/api/profiles/reorder',
    {
      schema: {
        description: 'Bulk update profile display order for reordering',
        tags: ['profiles'],
        body: {
          type: 'object',
          properties: {
            profiles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  displayOrder: { type: 'integer' },
                },
                required: ['id', 'displayOrder'],
              },
            },
          },
          required: ['profiles'],
        },
        response: { 200: { type: 'object', properties: { updated: { type: 'integer' } } } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as { profiles: Array<{ id: string; displayOrder: number }> };

      let updated = 0;

      // Update each profile's display order
      for (const item of body.profiles) {
        const existing = await app.db.query.rosterProfiles.findFirst({
          where: and(
            eq(schema.rosterProfiles.id, item.id),
            eq(schema.rosterProfiles.userId, session.user.id)
          ),
        });

        if (existing) {
          await app.db
            .update(schema.rosterProfiles)
            .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
            .where(eq(schema.rosterProfiles.id, item.id));
          updated++;
        }
      }

      return { updated };
    }
  );
}
