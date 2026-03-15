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

      try {
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
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, name: body.name },
          'Failed to create profile'
        );

        // Return user-friendly error messages
        if (error instanceof Error) {
          if (error.message.includes('foreign key')) {
            return reply.status(400).send({ error: 'User not properly initialized. Please try again.' });
          }
          if (error.message.includes('unique constraint')) {
            return reply.status(409).send({ error: 'A profile with this name already exists.' });
          }
        }

        return reply.status(500).send({ error: 'Failed to create profile. Please try again.' });
      }
    }
  );

  // Bulk update display order (for drag-to-reorder) - MUST be before /api/profiles/:id
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
        response: { 200: { type: 'object', properties: { success: { type: 'boolean' } } } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as { profiles: Array<{ id: string; displayOrder: number }> };

      app.logger.info({ userId: session.user.id, count: body.profiles.length }, 'Reordering profiles');

      let updated = 0;

      try {
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

        app.logger.info({ userId: session.user.id, updated }, 'Profiles reordered successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, count: body.profiles.length }, 'Failed to reorder profiles');
        return reply.status(500).send({ error: 'Failed to reorder profiles. Please try again.' });
      }
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

      try {
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
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch profiles');
        return reply.status(500).send({ error: 'Failed to fetch profiles. Please try again.' });
      }
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

      app.logger.info({ userId: session.user.id, profileId: id }, 'Deleting profile');

      // Verify ownership
      const existing = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!existing) {
        app.logger.warn({ userId: session.user.id, profileId: id }, 'Profile not found for deletion');
        return reply.status(404).send({ error: 'Profile not found' });
      }

      try {
        const [deleted] = await app.db
          .delete(schema.rosterProfiles)
          .where(eq(schema.rosterProfiles.id, id))
          .returning();

        app.logger.info({ userId: session.user.id, profileId: id }, 'Profile deleted successfully');
        return deleted;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, profileId: id }, 'Failed to delete profile');
        return reply.status(500).send({ error: 'Failed to delete profile. Please try again.' });
      }
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

      app.logger.info({ userId: session.user.id, profileId: id }, 'Moving profile to bench');

      // Verify ownership
      const existing = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!existing) {
        app.logger.warn({ userId: session.user.id, profileId: id }, 'Profile not found for bench action');
        return reply.status(404).send({ error: 'Profile not found' });
      }

      try {
        const [updated] = await app.db
          .update(schema.rosterProfiles)
          .set({
            status: 'bench',
            benchReason: body.reason,
            updatedAt: new Date(),
          })
          .where(eq(schema.rosterProfiles.id, id))
          .returning();

        // Create interaction record for bench status change
        try {
          await app.db
            .insert(schema.interactions)
            .values({
              userId: session.user.id,
              profileId: id,
              type: 'moved_to_bench',
              notes: body.reason,
            })
            .returning();
          app.logger.info({ userId: session.user.id, profileId: id }, 'Interaction recorded for bench status change');
        } catch (interactionError) {
          app.logger.warn({ err: interactionError, userId: session.user.id, profileId: id }, 'Failed to record bench interaction, but profile update succeeded');
        }

        app.logger.info({ userId: session.user.id, profileId: id }, 'Profile moved to bench successfully');
        return updated;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, profileId: id }, 'Failed to move profile to bench');
        return reply.status(500).send({ error: 'Failed to move profile to bench. Please try again.' });
      }
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

      app.logger.info({ userId: session.user.id, profileId: id }, 'Moving profile back to roster');

      // Verify ownership
      const existing = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!existing) {
        app.logger.warn({ userId: session.user.id, profileId: id }, 'Profile not found for roster action');
        return reply.status(404).send({ error: 'Profile not found' });
      }

      try {
        const [updated] = await app.db
          .update(schema.rosterProfiles)
          .set({
            status: 'roster',
            benchReason: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.rosterProfiles.id, id))
          .returning();

        // Create interaction record for roster status change
        try {
          await app.db
            .insert(schema.interactions)
            .values({
              userId: session.user.id,
              profileId: id,
              type: 'moved_to_roster',
            })
            .returning();
          app.logger.info({ userId: session.user.id, profileId: id }, 'Interaction recorded for roster status change');
        } catch (interactionError) {
          app.logger.warn({ err: interactionError, userId: session.user.id, profileId: id }, 'Failed to record roster interaction, but profile update succeeded');
        }

        app.logger.info({ userId: session.user.id, profileId: id }, 'Profile moved to roster successfully');
        return updated;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, profileId: id }, 'Failed to move profile to roster');
        return reply.status(500).send({ error: 'Failed to move profile to roster. Please try again.' });
      }
    }
  );

  // Add flag to profile (red or green) - accepts both 'type' and 'flagType' field names
  fastify.post<{
    Params: { id: string };
    Body: { flagText: string; type?: 'red' | 'green'; flagType?: 'red' | 'green' };
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
            flagType: { type: 'string', enum: ['red', 'green'] },
          },
          required: ['flagText'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as { flagText: string; type?: 'red' | 'green'; flagType?: 'red' | 'green' };

      // Accept both 'type' and 'flagType' field names
      const flagType = body.type || body.flagType;

      if (!flagType || (flagType !== 'red' && flagType !== 'green')) {
        return reply.status(400).send({ error: 'Flag type must be "red" or "green"' });
      }

      app.logger.info({ userId: session.user.id, profileId: id, flagType }, 'Adding flag to profile');

      // Verify ownership
      const profile = await app.db.query.rosterProfiles.findFirst({
        where: and(
          eq(schema.rosterProfiles.id, id),
          eq(schema.rosterProfiles.userId, session.user.id)
        ),
      });

      if (!profile) {
        app.logger.warn({ userId: session.user.id, profileId: id }, 'Profile not found for flag');
        return reply.status(404).send({ error: 'Profile not found' });
      }

      try {
        if (flagType === 'red') {
          const [flag] = await app.db
            .insert(schema.redFlags)
            .values({ profileId: id, flagText: body.flagText })
            .returning();
          app.logger.info({ userId: session.user.id, profileId: id, flagId: flag.id }, 'Red flag added successfully');
          return { id: flag.id, flagText: flag.flagText, type: 'red' };
        } else {
          const [flag] = await app.db
            .insert(schema.greenFlags)
            .values({ profileId: id, flagText: body.flagText })
            .returning();
          app.logger.info({ userId: session.user.id, profileId: id, flagId: flag.id }, 'Green flag added successfully');
          return { id: flag.id, flagText: flag.flagText, type: 'green' };
        }
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, profileId: id }, 'Failed to add flag');
        return reply.status(500).send({ error: 'Failed to add flag. Please try again.' });
      }
    }
  );

}
