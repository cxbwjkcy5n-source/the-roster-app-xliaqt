import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function registerRemindersRoutes(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as {
        profileId?: string;
        type: 'morning_text' | 'check_in' | 'date_reminder' | 'auto_nudge';
        scheduledFor: string;
        message: string;
      };

      // Verify profile ownership if profileId is provided
      if (body.profileId) {
        const profile = await app.db.query.rosterProfiles.findFirst({
          where: and(
            eq(schema.rosterProfiles.id, body.profileId),
            eq(schema.rosterProfiles.userId, session.user.id)
          ),
        });

        if (!profile) {
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

      return reminder;
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { type, sent } = request.query as {
        type?: 'morning_text' | 'check_in' | 'date_reminder' | 'auto_nudge';
        sent?: 'true' | 'false';
      };

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

      return reminders;
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as { [key: string]: any };

      // Verify ownership
      const existing = await app.db.query.reminders.findFirst({
        where: and(eq(schema.reminders.id, id), eq(schema.reminders.userId, session.user.id)),
      });

      if (!existing) {
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

      return updated;
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      // Verify ownership
      const existing = await app.db.query.reminders.findFirst({
        where: and(eq(schema.reminders.id, id), eq(schema.reminders.userId, session.user.id)),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Reminder not found' });
      }

      const [deleted] = await app.db
        .delete(schema.reminders)
        .where(eq(schema.reminders.id, id))
        .returning();

      return deleted;
    }
  );
}
