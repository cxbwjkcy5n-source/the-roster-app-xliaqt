import type { FastifyInstance } from 'fastify';
import { supabaseAuthMiddleware, requireAuth, type AuthenticatedRequest } from '../middleware/supabase-auth.js';
import { supabase } from '../lib/supabase.js';
import { ensureUserExists } from '../lib/ensure-user.js';
import { mapFieldsToSupabase } from '../lib/field-mapper.js';
import { attachCompatibilityScore, attachCompatibilityScores } from '../lib/compatibility-score.js';

export function registerRosterRoutes(fastify: FastifyInstance) {
  // Register auth middleware for roster routes
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
    if (request.url.startsWith('/api/roster')) {
      await supabaseAuthMiddleware(request, reply);
      await requireAuth(request, reply);
    }
  });

  // POST /api/roster - Create a new roster member
  fastify.post(
    '/api/roster',
    {
      schema: {
        description: 'Create a new roster member with compatibility scoring',
        tags: ['roster'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            location: { type: 'string' },
            phone_number: { type: 'string' },
            birthday_month: { type: 'string' },
            birthday_day: { type: 'integer' },
            birthday_year: { type: 'integer' },
            zodiac_sign: { type: 'string' },
            favorite_color: { type: 'string' },
            favorite_food: { type: 'string' },
            relationship_type: { type: 'string' },
            custom_relationship_type: { type: 'string' },
            how_you_met: { type: 'string' },
            how_we_met: { type: 'string' },
            instagram: { type: 'string' },
            twitter: { type: 'string' },
            facebook: { type: 'string' },
            snapchat: { type: 'string' },
            notes: { type: 'string' },
            interest_level: { type: 'integer' },
            profile_image_url: { type: 'string' },
            status: { type: 'string' },
            bench_reason: { type: 'string' },
            sort_order: { type: 'integer' },
            sexual_chemistry: { type: ['integer', 'null'] },
            attractiveness: { type: ['integer', 'null'] },
          },
          required: ['name'],
        },
        response: { 201: { type: 'object' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const body = request.body as Record<string, any>;

        // Ensure user exists
        await ensureUserExists(userId, request.userEmail!, request.userName!);

        // Map field names to Supabase format
        const mappedBody = mapFieldsToSupabase(body);

        // Insert new roster profile
        const { data, error } = await supabase
          .from('roster_profiles')
          .insert({
            user_id: userId,
            ...mappedBody,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (error) {
          console.error({ err: error, userId }, 'Error creating roster member');
          return reply.status(500).send({ error: { message: 'Failed to create roster member' } });
        }

        // Attach compatibility score
        const memberWithScore = await attachCompatibilityScore(data[0]);
        return reply.status(201).send(memberWithScore);
      } catch (error) {
        console.error({ err: error }, 'Error in POST /api/roster');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/roster - List all roster members for user
  fastify.get(
    '/api/roster',
    {
      schema: {
        description: 'Get all roster members with compatibility scores',
        tags: ['roster'],
        response: { 200: { type: 'array' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;

        const { data, error } = await supabase
          .from('roster_profiles')
          .select('*')
          .eq('user_id', userId)
          .order('sort_order', { ascending: true, nullsFirst: true });

        if (error) {
          console.error({ err: error, userId }, 'Error fetching roster members');
          return reply.status(500).send({ error: { message: 'Failed to fetch roster members' } });
        }

        // Attach compatibility scores to all members
        const membersWithScores = await attachCompatibilityScores(data || []);
        return membersWithScores;
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/roster');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/roster/:id - Get single roster member
  fastify.get(
    '/api/roster/:id',
    {
      schema: {
        description: 'Get a single roster member with compatibility score',
        tags: ['roster'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const { id } = request.params as { id: string };

        const { data, error } = await supabase
          .from('roster_profiles')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error({ err: error, id }, 'Error fetching roster member');
          return reply.status(500).send({ error: { message: 'Failed to fetch roster member' } });
        }

        if (!data) {
          return reply.status(404).send({ error: { message: 'Roster member not found' } });
        }

        // Attach compatibility score
        const memberWithScore = await attachCompatibilityScore(data);
        return memberWithScore;
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/roster/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // PUT /api/roster/:id - Update roster member
  fastify.put(
    '/api/roster/:id',
    {
      schema: {
        description: 'Update a roster member',
        tags: ['roster'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: { type: 'object' },
        response: { 200: { type: 'object' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const { id } = request.params as { id: string };
        const body = request.body as Record<string, any>;

        // Check ownership
        const { data: member, error: fetchError } = await supabase
          .from('roster_profiles')
          .select('id, user_id')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          return reply.status(500).send({ error: { message: 'Failed to fetch roster member' } });
        }

        if (!member) {
          return reply.status(404).send({ error: { message: 'Roster member not found' } });
        }

        if (member.user_id !== userId) {
          return reply.status(403).send({ error: { message: 'Forbidden' } });
        }

        // Map field names to Supabase format
        const mappedBody = mapFieldsToSupabase(body);

        // Update roster member
        const { data, error } = await supabase
          .from('roster_profiles')
          .update({
            ...mappedBody,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select();

        if (error) {
          console.error({ err: error, id }, 'Error updating roster member');
          return reply.status(500).send({ error: { message: 'Failed to update roster member' } });
        }

        // Attach compatibility score
        const memberWithScore = await attachCompatibilityScore(data[0]);
        return memberWithScore;
      } catch (error) {
        console.error({ err: error }, 'Error in PUT /api/roster/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // DELETE /api/roster/:id - Delete roster member
  fastify.delete(
    '/api/roster/:id',
    {
      schema: {
        description: 'Delete a roster member',
        tags: ['roster'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: { 204: { type: 'null' } },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userId!;
        const { id } = request.params as { id: string };

        // Check ownership
        const { data: member, error: fetchError } = await supabase
          .from('roster_profiles')
          .select('id, user_id')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          return reply.status(500).send({ error: { message: 'Failed to fetch roster member' } });
        }

        if (!member) {
          return reply.status(404).send({ error: { message: 'Roster member not found' } });
        }

        if (member.user_id !== userId) {
          return reply.status(403).send({ error: { message: 'Forbidden' } });
        }

        // Delete roster member
        const { error } = await supabase
          .from('roster_profiles')
          .delete()
          .eq('id', id);

        if (error) {
          console.error({ err: error, id }, 'Error deleting roster member');
          return reply.status(500).send({ error: { message: 'Failed to delete roster member' } });
        }

        return reply.status(204).send();
      } catch (error) {
        console.error({ err: error }, 'Error in DELETE /api/roster/:id');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );
}
