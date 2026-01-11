import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as appSchema from '../db/schema.js';
import * as authSchema from '../db/auth-schema.js';
import type { App } from '../index.js';

export function registerUserProfileRoutes(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // Get current user profile info
  fastify.get(
    '/api/user/profile',
    {
      schema: {
        description: 'Get authenticated user profile information',
        tags: ['user-profile'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              image: { type: 'string' },
              profileCompleted: { type: 'boolean' },
              emailVerified: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userProfile = await app.db.query.user.findFirst({
        where: eq(authSchema.user.id, session.user.id),
      });

      if (!userProfile) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        image: userProfile.image,
        profileCompleted: userProfile.profileCompleted,
        emailVerified: userProfile.emailVerified,
        createdAt: userProfile.createdAt,
      };
    }
  );

  // Get profile completion status
  fastify.get(
    '/api/user/profile-status',
    {
      schema: {
        description: 'Get profile completion status',
        tags: ['user-profile'],
        response: {
          200: {
            type: 'object',
            properties: {
              profileCompleted: { type: 'boolean' },
              requiresCompletion: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userProfile = await app.db.query.user.findFirst({
        where: eq(authSchema.user.id, session.user.id),
      });

      if (!userProfile) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        profileCompleted: userProfile.profileCompleted,
        requiresCompletion: !userProfile.profileCompleted,
      };
    }
  );

  // Update user profile (name and basic info)
  fastify.put<{
    Body: {
      name?: string;
      image?: string;
      imageKey?: string;
      profileCompleted?: boolean;
    };
  }>(
    '/api/user/profile',
    {
      schema: {
        description: 'Update user profile information',
        tags: ['user-profile'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            image: { type: 'string' },
            imageKey: { type: 'string' },
            profileCompleted: { type: 'boolean' },
          },
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as {
        name?: string;
        image?: string;
        imageKey?: string;
        profileCompleted?: boolean;
      };

      // Verify user exists
      const existingUser = await app.db.query.user.findFirst({
        where: eq(authSchema.user.id, session.user.id),
      });

      if (!existingUser) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Validate name if provided
      if (body.name !== undefined && body.name.trim().length === 0) {
        return reply.status(400).send({ error: 'Name cannot be empty' });
      }

      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) {
        updateData.name = body.name;
      }

      if (body.image !== undefined) {
        updateData.image = body.image;
      }

      if (body.imageKey !== undefined) {
        updateData.imageKey = body.imageKey;
      }

      if (body.profileCompleted !== undefined) {
        updateData.profileCompleted = body.profileCompleted;
      }

      const [updatedUser] = await app.db
        .update(authSchema.user)
        .set(updateData)
        .where(eq(authSchema.user.id, session.user.id))
        .returning();

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        profileCompleted: updatedUser.profileCompleted,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    }
  );

  // Upload user profile image
  fastify.post(
    '/api/user/profile-image',
    {
      schema: {
        description: 'Upload user profile image',
        tags: ['user-profile'],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              key: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const options = { limits: { fileSize: 5 * 1024 * 1024 } }; // 5MB limit
      const data = await request.file(options);

      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        // File size limit was exceeded
        return reply.status(413).send({ error: 'File too large (max 5MB)' });
      }

      // Validate file type (basic check for image)
      const mimeType = data.mimetype;
      if (!mimeType.startsWith('image/')) {
        return reply.status(400).send({ error: 'File must be an image' });
      }

      const fileExtension = data.filename.split('.').pop() || 'jpg';
      const key = `uploads/user-profiles/${session.user.id}/${Date.now()}.${fileExtension}`;

      try {
        const uploadedKey = await app.storage.upload(key, buffer);
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        // Update user profile with image
        await app.db
          .update(authSchema.user)
          .set({
            image: url,
            imageKey: uploadedKey,
            updatedAt: new Date(),
          })
          .where(eq(authSchema.user.id, session.user.id));

        return { url, key: uploadedKey };
      } catch (error) {
        app.logger.error(error, 'Failed to upload user profile image');
        return reply.status(500).send({ error: 'Failed to upload image' });
      }
    }
  );

  // Mark profile as completed
  fastify.post(
    '/api/user/complete-profile',
    {
      schema: {
        description: 'Mark user profile as completed',
        tags: ['user-profile'],
        response: {
          200: {
            type: 'object',
            properties: {
              profileCompleted: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Verify user exists
      const existingUser = await app.db.query.user.findFirst({
        where: eq(authSchema.user.id, session.user.id),
      });

      if (!existingUser) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const [updatedUser] = await app.db
        .update(authSchema.user)
        .set({
          profileCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(authSchema.user.id, session.user.id))
        .returning();

      return {
        profileCompleted: updatedUser.profileCompleted,
        message: 'Profile setup completed successfully',
      };
    }
  );
}
