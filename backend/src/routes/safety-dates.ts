import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { requireDualAuth } from '../utils/auth-utils.js';

export function registerSafetyDatesRoutes(app: App, fastify: FastifyInstance) {

  // Create a new safety date
  fastify.post<{
    Body: {
      profileName: string;
      dateWithName: string;
      dateWithDescription?: string;
      location: string;
      locationAddress?: string;
      coordinates?: { latitude: number; longitude: number };
      notes?: string;
      profilePhotoUrl?: string;
      licensePlate?: string;
      rosterProfileId?: string;
      emergencyContacts?: Array<{ contactName: string; phoneNumber: string }>;
    };
  }>(
    '/api/safety-dates',
    {
      schema: {
        description: 'Create a new safety date',
        tags: ['safety-dates'],
        body: {
          type: 'object',
          properties: {
            profileName: { type: 'string', minLength: 1 },
            dateWithName: { type: 'string', minLength: 1 },
            dateWithDescription: { type: 'string' },
            location: { type: 'string', minLength: 1 },
            locationAddress: { type: 'string' },
            coordinates: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
              },
            },
            notes: { type: 'string' },
            profilePhotoUrl: { type: 'string' },
            licensePlate: { type: 'string' },
            rosterProfileId: { type: 'string' },
            emergencyContacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  contactName: { type: 'string' },
                  phoneNumber: { type: 'string' },
                },
                required: ['contactName', 'phoneNumber'],
              },
              maxItems: 3,
            },
          },
          required: ['profileName', 'dateWithName', 'location'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const body = request.body as {
        profileName: string;
        dateWithName: string;
        dateWithDescription?: string;
        location: string;
        locationAddress?: string;
        coordinates?: { latitude: number; longitude: number };
        notes?: string;
        profilePhotoUrl?: string;
        licensePlate?: string;
        rosterProfileId?: string;
        emergencyContacts?: Array<{ contactName: string; phoneNumber: string }>;
      };

      // Validate emergency contacts (max 3)
      if (body.emergencyContacts && body.emergencyContacts.length > 3) {
        return reply.status(400).send({ error: 'Maximum 3 emergency contacts allowed' });
      }

      // Validate emergency contact data
      if (body.emergencyContacts) {
        for (const contact of body.emergencyContacts) {
          if (!contact.contactName?.trim() || !contact.phoneNumber?.trim()) {
            return reply.status(400).send({ error: 'Contact name and phone number are required' });
          }
        }
      }

      // Auto-fetch profile photo if rosterProfileId provided
      let profilePhotoUrl = body.profilePhotoUrl;
      if (body.rosterProfileId) {
        const rosterProfile = await app.db.query.rosterProfiles.findFirst({
          where: eq(schema.rosterProfiles.id, body.rosterProfileId),
        });
        if (rosterProfile?.profileImageUrl) {
          profilePhotoUrl = rosterProfile.profileImageUrl;
        }
      }

      const [safetyDate] = await app.db
        .insert(schema.safetyDates)
        .values({
          userId: session.user.id,
          profileName: body.profileName,
          dateWithName: body.dateWithName,
          dateWithDescription: body.dateWithDescription,
          location: body.location,
          locationAddress: body.locationAddress,
          coordinates: body.coordinates,
          notes: body.notes,
          profilePhotoUrl: profilePhotoUrl,
          licensePlate: body.licensePlate,
          startTime: new Date(),
        })
        .returning();

      // Add emergency contacts if provided
      if (body.emergencyContacts && body.emergencyContacts.length > 0) {
        for (const contact of body.emergencyContacts) {
          await app.db.insert(schema.emergencyContacts).values({
            userId: session.user.id,
            safetyDateId: safetyDate.id,
            contactName: contact.contactName,
            phoneNumber: contact.phoneNumber,
          });
        }
      }

      // Fetch the created safety date with emergency contacts
      const safetyDateWithContacts = await app.db.query.safetyDates.findFirst({
        where: eq(schema.safetyDates.id, safetyDate.id),
        with: {
          emergencyContacts: true,
        },
      });

      return safetyDateWithContacts;
    }
  );

  // Get active safety date (currently ongoing)
  fastify.get(
    '/api/safety-dates/active',
    {
      schema: {
        description: 'Get the current active safety date',
        tags: ['safety-dates'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const activeSafetyDate = await app.db.query.safetyDates.findFirst({
        where: and(
          eq(schema.safetyDates.userId, session.user.id),
          eq(schema.safetyDates.status, 'active')
        ),
        with: {
          emergencyContacts: true,
        },
      });

      if (!activeSafetyDate) {
        return reply.status(404).send({ error: 'No active safety date found' });
      }

      return activeSafetyDate;
    }
  );

  // Get all safety dates (history)
  fastify.get(
    '/api/safety-dates',
    {
      schema: {
        description: 'Get all safety dates (history)',
        tags: ['safety-dates'],
        response: { 200: { type: 'array' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const safetyDates = await app.db.query.safetyDates.findMany({
        where: eq(schema.safetyDates.userId, session.user.id),
        with: {
          emergencyContacts: true,
        },
        orderBy: desc(schema.safetyDates.createdAt),
      });

      return safetyDates;
    }
  );

  // Get specific safety date
  fastify.get<{ Params: { id: string } }>(
    '/api/safety-dates/:id',
    {
      schema: {
        description: 'Get a specific safety date',
        tags: ['safety-dates'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };

      const safetyDate = await app.db.query.safetyDates.findFirst({
        where: and(
          eq(schema.safetyDates.id, id),
          eq(schema.safetyDates.userId, session.user.id)
        ),
        with: {
          emergencyContacts: true,
        },
      });

      if (!safetyDate) {
        return reply.status(404).send({ error: 'Safety date not found' });
      }

      return safetyDate;
    }
  );

  // Mark safety date as completed
  fastify.put<{ Params: { id: string } }>(
    '/api/safety-dates/:id/complete',
    {
      schema: {
        description: 'Mark a safety date as completed',
        tags: ['safety-dates'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };

      // Verify ownership
      const existing = await app.db.query.safetyDates.findFirst({
        where: and(
          eq(schema.safetyDates.id, id),
          eq(schema.safetyDates.userId, session.user.id)
        ),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Safety date not found' });
      }

      const [updated] = await app.db
        .update(schema.safetyDates)
        .set({
          status: 'completed',
          endTime: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.safetyDates.id, id))
        .returning();

      return updated;
    }
  );

  // Mark safety date as emergency
  fastify.put<{ Params: { id: string } }>(
    '/api/safety-dates/:id/emergency',
    {
      schema: {
        description: 'Mark a safety date as emergency (user in danger)',
        tags: ['safety-dates'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };

      // Verify ownership
      const existing = await app.db.query.safetyDates.findFirst({
        where: and(
          eq(schema.safetyDates.id, id),
          eq(schema.safetyDates.userId, session.user.id)
        ),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Safety date not found' });
      }

      const [updated] = await app.db
        .update(schema.safetyDates)
        .set({
          status: 'emergency',
          updatedAt: new Date(),
        })
        .where(eq(schema.safetyDates.id, id))
        .returning();

      return updated;
    }
  );

  // Add emergency contact to safety date
  fastify.post<{
    Params: { id: string };
    Body: { contactName: string; phoneNumber: string };
  }>(
    '/api/safety-dates/:id/emergency-contacts',
    {
      schema: {
        description: 'Add an emergency contact to a safety date',
        tags: ['safety-dates'],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: {
          type: 'object',
          properties: {
            contactName: { type: 'string', minLength: 1 },
            phoneNumber: { type: 'string', minLength: 1 },
          },
          required: ['contactName', 'phoneNumber'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as { contactName: string; phoneNumber: string };

      // Verify safety date exists and belongs to user
      const safetyDate = await app.db.query.safetyDates.findFirst({
        where: and(
          eq(schema.safetyDates.id, id),
          eq(schema.safetyDates.userId, session.user.id)
        ),
      });

      if (!safetyDate) {
        return reply.status(404).send({ error: 'Safety date not found' });
      }

      // Check contact count limit
      const contactCount = await app.db
        .select()
        .from(schema.emergencyContacts)
        .where(eq(schema.emergencyContacts.safetyDateId, id));

      if (contactCount.length >= 3) {
        return reply.status(400).send({ error: 'Maximum 3 emergency contacts allowed' });
      }

      const [contact] = await app.db
        .insert(schema.emergencyContacts)
        .values({
          userId: session.user.id,
          safetyDateId: id,
          contactName: body.contactName,
          phoneNumber: body.phoneNumber,
        })
        .returning();

      return contact;
    }
  );

  // Delete emergency contact
  fastify.delete<{ Params: { id: string; contactId: string } }>(
    '/api/safety-dates/:id/emergency-contacts/:contactId',
    {
      schema: {
        description: 'Remove an emergency contact from a safety date',
        tags: ['safety-dates'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contactId: { type: 'string' },
          },
          required: ['id', 'contactId'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      const { id, contactId } = request.params as { id: string; contactId: string };

      // Verify contact exists and belongs to user
      const contact = await app.db.query.emergencyContacts.findFirst({
        where: and(
          eq(schema.emergencyContacts.id, contactId),
          eq(schema.emergencyContacts.userId, session.user.id),
          eq(schema.emergencyContacts.safetyDateId, id)
        ),
      });

      if (!contact) {
        return reply.status(404).send({ error: 'Emergency contact not found' });
      }

      const [deleted] = await app.db
        .delete(schema.emergencyContacts)
        .where(eq(schema.emergencyContacts.id, contactId))
        .returning();

      return deleted;
    }
  );

  // Update safety date (location, description, etc.)
  fastify.put<{ Params: { id: string }; Body: { [key: string]: any } }>(
    '/api/safety-dates/:id',
    {
      schema: {
        description: 'Update safety date information',
        tags: ['safety-dates'],
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

      // Verify ownership
      const existing = await app.db.query.safetyDates.findFirst({
        where: and(
          eq(schema.safetyDates.id, id),
          eq(schema.safetyDates.userId, session.user.id)
        ),
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Safety date not found' });
      }

      // Prevent updating status through this endpoint
      const allowedFields = ['profileName', 'dateWithName', 'dateWithDescription', 'location', 'locationAddress', 'coordinates', 'notes', 'profilePhotoUrl', 'licensePlate'];
      const updateData: Record<string, any> = { updatedAt: new Date() };

      for (const field of allowedFields) {
        if (field in body) {
          updateData[field] = body[field];
        }
      }

      const [updated] = await app.db
        .update(schema.safetyDates)
        .set(updateData)
        .where(eq(schema.safetyDates.id, id))
        .returning();

      return updated;
    }
  );
}
