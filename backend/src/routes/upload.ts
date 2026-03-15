import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';
import type { App } from '../index.js';
import { requireDualAuth, ensureUserExists } from '../utils/auth-utils.js';

export function registerUploadRoutes(app: App, fastify: FastifyInstance) {
  // Upload profile image
  fastify.post<{ Body: { image: string } }>(
    '/api/upload/profile-image',
    {
      schema: {
        description: 'Upload a profile image via base64 or URL',
        tags: ['upload'],
        body: {
          type: 'object',
          properties: {
            image: { type: 'string', description: 'Base64 data URL (data:image/...) or remote URL or plain base64' },
          },
          required: ['image'],
        },
        response: { 200: { type: 'object', properties: { url: { type: 'string' }, key: { type: 'string' } } } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      await ensureUserExists(app, session.user.id);

      const body = request.body as { image: string };

      if (!body.image) {
        app.logger.warn({ userId: session.user.id }, 'Profile image upload: no image data provided');
        return reply.status(400).send({ error: 'image field is required' });
      }

      const imageUrl = body.image;
      const key = `profile-images/${session.user.id}/${Date.now()}`;

      try {
        app.logger.info({ userId: session.user.id, key }, 'Updating profile image');

        // Update user profile with image URL
        await app.db
          .update(authSchema.user)
          .set({ image: imageUrl, updatedAt: new Date() })
          .where(eq(authSchema.user.id, session.user.id));

        app.logger.info({ userId: session.user.id, key }, 'Profile image updated successfully');
        return { url: imageUrl, key };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, key }, 'Failed to update profile image');
        return reply.status(500).send({ error: 'Failed to update image' });
      }
    }
  );

  // Upload roster image
  fastify.post<{ Body: { image: string } }>(
    '/api/upload/roster-image',
    {
      schema: {
        description: 'Upload a roster image via base64 or URL',
        tags: ['upload'],
        body: {
          type: 'object',
          properties: {
            image: { type: 'string', description: 'Base64 data URL (data:image/...) or remote URL or plain base64' },
          },
          required: ['image'],
        },
        response: { 200: { type: 'object', properties: { url: { type: 'string' }, key: { type: 'string' } } } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      await ensureUserExists(app, session.user.id);

      const body = request.body as { image: string };

      if (!body.image) {
        app.logger.warn({ userId: session.user.id }, 'Roster image upload: no image data provided');
        return reply.status(400).send({ error: 'image field is required' });
      }

      const imageUrl = body.image;
      const key = `roster-images/${session.user.id}/${Date.now()}`;

      app.logger.info({ userId: session.user.id, key }, 'Roster image data received');

      // Return the image URL and key for the caller to use when saving a roster profile
      return { url: imageUrl, key };
    }
  );
}
