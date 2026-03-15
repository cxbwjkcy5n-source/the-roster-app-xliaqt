import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as appSchema from '../db/schema.js';
import * as authSchema from '../db/auth-schema.js';
import type { App } from '../index.js';
import { requireDualAuth, ensureUserExists } from '../utils/auth-utils.js';

export function registerUserProfileRoutes(app: App, fastify: FastifyInstance) {

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
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user profile');

      try {
        // Auto-upsert user row
        await ensureUserExists(app, session.user.id);

        // Fetch user profile
        const userProfile = await app.db.query.user.findFirst({
          where: eq(authSchema.user.id, session.user.id),
        });

        // Return profile (should exist after upsert)
        if (userProfile) {
          app.logger.info({ userId: session.user.id }, 'User profile fetched successfully');
          return {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            age: userProfile.age,
            location: userProfile.location,
            phoneNumber: userProfile.phoneNumber,
            favoriteColor: userProfile.favoriteColor,
            favoriteFoodType: userProfile.favoriteFoodType,
            instagram: userProfile.instagram,
            twitter: userProfile.twitter,
            notes: userProfile.notes,
            image: userProfile.image,
            imageKey: userProfile.imageKey,
            profileCompleted: userProfile.profileCompleted || false,
            emailVerified: userProfile.emailVerified,
            createdAt: userProfile.createdAt,
            updatedAt: userProfile.updatedAt,
          };
        }

        // Return default profile if somehow still not found
        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || 'User',
          age: undefined,
          location: undefined,
          phoneNumber: undefined,
          favoriteColor: undefined,
          favoriteFoodType: undefined,
          instagram: undefined,
          twitter: undefined,
          notes: undefined,
          image: undefined,
          imageKey: undefined,
          profileCompleted: false,
          emailVerified: true,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch user profile');
        return reply.status(500).send({ error: 'Failed to fetch user profile. Please try again.' });
      }
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
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching profile completion status');

      try {
        let userProfile = await app.db.query.user.findFirst({
          where: eq(authSchema.user.id, session.user.id),
        });

        // If user doesn't exist, create it first
        if (!userProfile) {
          app.logger.info({ userId: session.user.id }, 'User profile not found, creating from session data');
          try {
            await app.db.insert(authSchema.user).values({
              id: session.user.id,
              email: session.user.email,
              name: session.user.name || session.user.email.split('@')[0],
              emailVerified: true,
              profileCompleted: false,
            });

            // Fetch the newly created user
            userProfile = await app.db.query.user.findFirst({
              where: eq(authSchema.user.id, session.user.id),
            });
          } catch (error) {
            app.logger.warn({ err: error, userId: session.user.id }, 'Failed to create user profile, returning default status');
            // Return default status for new user
            return {
              profileCompleted: false,
              requiresCompletion: true,
            };
          }
        }

        const profileCompleted = userProfile?.profileCompleted || false;
        app.logger.info({ userId: session.user.id, profileCompleted }, 'Profile completion status retrieved');

        return {
          profileCompleted,
          requiresCompletion: !profileCompleted,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch profile completion status');
        return reply.status(500).send({ error: 'Failed to fetch profile completion status. Please try again.' });
      }
    }
  );

  // Update user profile (name and basic info) - creates profile if it doesn't exist
  fastify.put<{
    Body: {
      name?: string;
      age?: string;
      location?: string;
      phoneNumber?: string;
      favoriteColor?: string;
      favoriteFoodType?: string;
      instagram?: string;
      twitter?: string;
      notes?: string;
      image?: string;
      imageKey?: string;
      profileCompleted?: boolean;
    };
  }>(
    '/api/user/profile',
    {
      schema: {
        description: 'Update user profile information (creates if not exists)',
        tags: ['user-profile'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            age: { type: 'string' },
            location: { type: 'string' },
            phoneNumber: { type: 'string' },
            favoriteColor: { type: 'string' },
            favoriteFoodType: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            notes: { type: 'string' },
            image: { type: 'string' },
            imageKey: { type: 'string' },
            profileCompleted: { type: 'boolean' },
          },
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as {
        name?: string;
        age?: string;
        location?: string;
        phoneNumber?: string;
        favoriteColor?: string;
        favoriteFoodType?: string;
        instagram?: string;
        twitter?: string;
        notes?: string;
        image?: string;
        imageKey?: string;
        profileCompleted?: boolean;
      };

      app.logger.info({ userId: session.user.id }, 'Updating user profile (upsert)');

      try {
        // Validate name if provided
        if (body.name !== undefined && body.name.trim().length === 0) {
          app.logger.warn({ userId: session.user.id }, 'Update attempted with empty name');
          return reply.status(400).send({ error: 'Name cannot be empty' });
        }

        // Build upsert data - only include fields that are provided
        const upsertData: any = {
          id: session.user.id,
          email: session.user.email,
          name: body.name || session.user.name || 'User',
          emailVerified: true,
        };

        if (body.age !== undefined) upsertData.age = body.age;
        if (body.location !== undefined) upsertData.location = body.location;
        if (body.phoneNumber !== undefined) upsertData.phoneNumber = body.phoneNumber;
        if (body.favoriteColor !== undefined) upsertData.favoriteColor = body.favoriteColor;
        if (body.favoriteFoodType !== undefined) upsertData.favoriteFoodType = body.favoriteFoodType;
        if (body.instagram !== undefined) upsertData.instagram = body.instagram;
        if (body.twitter !== undefined) upsertData.twitter = body.twitter;
        if (body.notes !== undefined) upsertData.notes = body.notes;
        if (body.image !== undefined) upsertData.image = body.image;
        if (body.imageKey !== undefined) upsertData.imageKey = body.imageKey;
        if (body.profileCompleted !== undefined) upsertData.profileCompleted = body.profileCompleted;

        // Use INSERT...ON CONFLICT to upsert
        const [updatedUser] = await app.db
          .insert(authSchema.user)
          .values(upsertData)
          .onConflictDoUpdate({
            target: authSchema.user.id,
            set: { ...upsertData, updatedAt: new Date() },
          })
          .returning();

        app.logger.info({ userId: session.user.id }, 'User profile updated successfully');

        return {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          age: updatedUser.age,
          location: updatedUser.location,
          phoneNumber: updatedUser.phoneNumber,
          favoriteColor: updatedUser.favoriteColor,
          favoriteFoodType: updatedUser.favoriteFoodType,
          instagram: updatedUser.instagram,
          twitter: updatedUser.twitter,
          notes: updatedUser.notes,
          image: updatedUser.image,
          imageKey: updatedUser.imageKey,
          profileCompleted: updatedUser.profileCompleted,
          emailVerified: updatedUser.emailVerified,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to update user profile');
        return reply.status(500).send({ error: 'Failed to update user profile. Please try again.' });
      }
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
      const session = await requireDualAuth(request, reply, app);
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
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Marking profile as completed');

      try {
        // Auto-upsert user row
        await ensureUserExists(app, session.user.id);

        // Update profileCompleted
        const [updatedUser] = await app.db
          .insert(authSchema.user)
          .values({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name || 'User',
            profileCompleted: true,
          })
          .onConflictDoUpdate({
            target: authSchema.user.id,
            set: {
              profileCompleted: true,
              updatedAt: new Date(),
            },
          })
          .returning();

        app.logger.info({ userId: session.user.id }, 'Profile marked as completed successfully');

        return {
          success: true,
          profileCompleted: updatedUser.profileCompleted,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to mark profile as completed');
        return reply.status(500).send({ error: 'Failed to mark profile as completed. Please try again.' });
      }
    }
  );
}
