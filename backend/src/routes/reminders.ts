import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth, ensureUserExists } from '../utils/auth-utils.js';

export function registerRemindersRoutes(app: App, fastify: FastifyInstance) {

  // Create reminder
  fastify.post<{
    Body: {
      profileId?: string;
      type: 'morning_text' | 'check_in' | 'date_reminder' | 'auto_nudge';
      scheduledFor: string;
      message: string;
    };
  }>(
    '/api/reminders',
    {
      schema: {
        description: 'Create a reminder',
        tags: ['reminders'],
        body: {
          type: 'object',
          properties: {
            profileId: { type: 'string' },
            type: { type: 'string', enum: ['morning_text', 'check_in', 'date_reminder', 'auto_nudge'] },
            scheduledFor: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['type', 'scheduledFor', 'message'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as {
        profileId?: string;
        type: 'morning_text' | 'check_in' | 'date_reminder' | 'auto_nudge';
        scheduledFor: string;
        message: string;
      };

      app.logger.info({ userId: session.user.id, type: body.type }, 'Creating reminder');

      try {
        // Auto-upsert user row
        await ensureUserExists(app, session.user.id);

        // Verify profile ownership if profileId is provided
        if (body.profileId) {
          const profile = await app.db.query.rosterProfiles.findFirst({
            where: and(
              eq(schema.rosterProfiles.id, body.profileId),
              eq(schema.rosterProfiles.userId, session.user.id)
            ),
          });

          if (!profile) {
            app.logger.warn({ userId: session.user.id, profileId: body.profileId }, 'Profile not found for reminder');
            return reply.status(404).send({ error: 'Profile not found' });
          }
        }

        const [reminder] = await app.db
          .insert(schema.reminders)
          .values({
            userId: session.user.id,
            profileId: body.profileId,
            type: body.type,
            scheduledFor: new Date(body.scheduledFor),
            message: body.message,
          })
          .returning();

        app.logger.info({ userId: session.user.id, reminderId: reminder.id }, 'Reminder created successfully');
        return reminder;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, type: body.type }, 'Failed to create reminder');
        return reply.status(500).send({ error: 'Failed to create reminder. Please try again.' });
      }
    }
  );

  // Get all reminders for user
  fastify.get<{
    Querystring: {
      type?: 'morning_text' | 'check_in' | 'date_reminder' | 'auto_nudge';
      sent?: 'true' | 'false';
    };
  }>(
    '/api/reminders',
    {
      schema: {
        description: 'Get all reminders for the authenticated user',
        tags: ['reminders'],
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['morning_text', 'check_in', 'date_reminder', 'auto_nudge'] },
            sent: { type: 'string', enum: ['true', 'false'] },
          },
        },
        response: { 200: { type: 'array' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { type, sent } = request.query as {
        type?: 'morning_text' | 'check_in' | 'date_reminder' | 'auto_nudge';
        sent?: 'true' | 'false';
      };

      app.logger.info({ userId: session.user.id, type, sent }, 'Fetching reminders');

      try {
        let whereConditions: any = eq(schema.reminders.userId, session.user.id);

        if (type && sent !== undefined) {
          whereConditions = and(
            eq(schema.reminders.userId, session.user.id),
            eq(schema.reminders.type, type),
            eq(schema.reminders.sent, sent === 'true')
          );
        } else if (type) {
          whereConditions = and(
            eq(schema.reminders.userId, session.user.id),
            eq(schema.reminders.type, type)
          );
        } else if (sent !== undefined) {
          whereConditions = and(
            eq(schema.reminders.userId, session.user.id),
            eq(schema.reminders.sent, sent === 'true')
          );
        }

        const reminders = await app.db.query.reminders.findMany({
          where: whereConditions,
          with: {
            profile: true,
          },
        });

        app.logger.info({ userId: session.user.id, count: reminders.length }, 'Reminders fetched successfully');
        return reminders;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch reminders');
        return reply.status(500).send({ error: 'Failed to fetch reminders. Please try again.' });
      }
    }
  );

  // Update reminder
  fastify.put<{
    Params: { id: string };
    Body: { [key: string]: any };
  }>(
    '/api/reminders/:id',
    {
      schema: {
        description: 'Update a reminder',
        tags: ['reminders'],
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

      app.logger.info({ userId: session.user.id, reminderId: id }, 'Updating reminder');

      try {
        // Verify ownership
        const existing = await app.db.query.reminders.findFirst({
          where: and(eq(schema.reminders.id, id), eq(schema.reminders.userId, session.user.id)),
        });

        if (!existing) {
          app.logger.warn({ userId: session.user.id, reminderId: id }, 'Reminder not found for update');
          return reply.status(404).send({ error: 'Reminder not found' });
        }

        const updateData: Record<string, any> = { ...body, updatedAt: new Date() };
        if (body.scheduledFor) {
          updateData.scheduledFor = new Date(body.scheduledFor);
        }

        const [updated] = await app.db
          .update(schema.reminders)
          .set(updateData)
          .where(eq(schema.reminders.id, id))
          .returning();

        app.logger.info({ userId: session.user.id, reminderId: id }, 'Reminder updated successfully');
        return updated;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, reminderId: id }, 'Failed to update reminder');
        return reply.status(500).send({ error: 'Failed to update reminder. Please try again.' });
      }
    }
  );

  // Delete reminder
  fastify.delete<{ Params: { id: string } }>(
    '/api/reminders/:id',
    {
      schema: {
        description: 'Delete a reminder',
        tags: ['reminders'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, reminderId: id }, 'Deleting reminder');

      try {
        // Verify ownership
        const existing = await app.db.query.reminders.findFirst({
          where: and(eq(schema.reminders.id, id), eq(schema.reminders.userId, session.user.id)),
        });

        if (!existing) {
          app.logger.warn({ userId: session.user.id, reminderId: id }, 'Reminder not found for deletion');
          return reply.status(404).send({ error: 'Reminder not found' });
        }

        const [deleted] = await app.db
          .delete(schema.reminders)
          .where(eq(schema.reminders.id, id))
          .returning();

        app.logger.info({ userId: session.user.id, reminderId: id }, 'Reminder deleted successfully');
        return deleted;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, reminderId: id }, 'Failed to delete reminder');
        return reply.status(500).send({ error: 'Failed to delete reminder. Please try again.' });
      }
    }
  );
}
