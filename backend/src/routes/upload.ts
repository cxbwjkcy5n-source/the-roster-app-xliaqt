import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerUploadRoutes(app: App, fastify: FastifyInstance) {
  // Upload profile image
  fastify.post(
    '/api/upload/profile-image',
    {
      schema: {
        description: 'Upload a profile image',
        tags: ['upload'],
        consumes: ['multipart/form-data'],
        response: { 200: { type: 'object', properties: { url: { type: 'string' }, key: { type: 'string' } } } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Profile image upload started');

      const options = { limits: { fileSize: 5 * 1024 * 1024 } }; // 5MB limit
      const data = await request.file(options);

      if (!data) {
        app.logger.warn({ userId: session.user.id }, 'Profile image upload: no file provided');
        return reply.status(400).send({ error: 'No file provided' });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        app.logger.warn({ userId: session.user.id, filename: data.filename }, 'Profile image upload: file size too large');
        // File size limit was exceeded
        return reply.status(413).send({ error: 'File too large (max 5MB)' });
      }

      // Validate file type (basic check for image)
      const mimeType = data.mimetype;
      if (!mimeType.startsWith('image/')) {
        app.logger.warn({ userId: session.user.id, mimeType }, 'Profile image upload: invalid file type');
        return reply.status(400).send({ error: 'File must be an image' });
      }

      const fileExtension = data.filename.split('.').pop() || 'jpg';
      const key = `uploads/profile-images/${session.user.id}/${Date.now()}.${fileExtension}`;

      try {
        app.logger.debug({ userId: session.user.id, key, filename: data.filename }, 'Uploading profile image to storage');
        const uploadedKey = await app.storage.upload(key, buffer);
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        app.logger.info({ userId: session.user.id, key: uploadedKey }, 'Profile image uploaded successfully');
        return { url, key: uploadedKey };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, key }, 'Failed to upload profile image');
        return reply.status(500).send({ error: 'Failed to upload image' });
      }
    }
  );
}
