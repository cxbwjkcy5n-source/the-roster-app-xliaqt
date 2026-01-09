import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerRosterRoutes(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // Create new roster profile
  fastify.post<{ Body: { name: string; [key: string]: any } }>(
    '/api/roster/profiles',
    {
      schema: {
        description: 'Create a new roster profile',
        tags: ['roster'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            birthdayMonth: { type: 'integer' },
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
            interestLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            profileImageUrl: { type: 'string' },
            profileImageKey: { type: 'string' },
            status: { type: 'string', enum: ['roster', 'bench'] },
          },
          required: ['name'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as { name: string; [key: string]: any };
      const [profile] = await app.db
        .insert(schema.rosterProfiles)
        .values({
          name: body.name,
          userId: session.user.id,
          age: body.age,
          birthdayMonth: body.birthdayMonth,
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
          interestLevel: body.interestLevel,
          profileImageUrl: body.profileImageUrl,
          profileImageKey: body.profileImageKey,
          status: body.status,
        })
        .returning();

      return profile;
    }
  );

  // Get all profiles for authenticated user
  fastify.get(
    '/api/roster/profiles',
    {
      schema: {
        description: 'Get all roster profiles for the authenticated user',
        tags: ['roster'],
        response: { 200: { type: 'array' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const profiles = await app.db.query.rosterProfiles.findMany({
        where: eq(schema.rosterProfiles.userId, session.user.id),
        with: {
          redFlags: true,
          greenFlags: true,
          dates: true,
        },
      });

      return profiles;
    }
  );

  // Get single profile
  fastify.get<{ Params: { id: string } }>(
    '/api/roster/profiles/:id',
    {
      schema: {
        description: 'Get a single roster profile',
        tags: ['roster'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

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
        return reply.status(404).send({ error: 'Profile not found' });
      }

      return profile;
    }
  );

  // Update profile
  fastify.put<{ Params: { id: string }; Body: { [key: string]: any } }>(
    '/api/roster/profiles/:id',
    {
      schema: {
        description: 'Update a roster profile',
        tags: ['roster'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: { type: 'object' },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as { [key: string]: any };

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

      const updateData: Record<string, any> = { ...body, updatedAt: new Date() };

      const [updated] = await app.db
        .update(schema.rosterProfiles)
        .set(updateData)
        .where(eq(schema.rosterProfiles.id, id))
        .returning();

      return updated;
    }
  );

  // Delete profile
  fastify.delete<{ Params: { id: string } }>(
    '/api/roster/profiles/:id',
    {
      schema: {
        description: 'Delete a roster profile',
        tags: ['roster'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
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

  // Add flag to profile (red or green)
  fastify.post<{
    Params: { id: string };
    Body: { flagText: string; flagType: 'red' | 'green' };
  }>(
    '/api/roster/profiles/:id/flags',
    {
      schema: {
        description: 'Add a red or green flag to a profile',
        tags: ['roster'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: {
          type: 'object',
          properties: {
            flagText: { type: 'string' },
            flagType: { type: 'string', enum: ['red', 'green'] },
          },
          required: ['flagText', 'flagType'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const { flagText, flagType } = request.body as { flagText: string; flagType: 'red' | 'green' };

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

      if (flagType === 'red') {
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
}
