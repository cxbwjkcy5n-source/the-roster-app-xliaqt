import type { FastifyInstance } from 'fastify';
import { supabaseAuthMiddleware, requireAuth, type AuthenticatedRequest } from '../middleware/supabase-auth.js';
import { getPlaceAutocomplete, getPlaceDetails } from '../lib/google-places.js';

export function registerPlacesRoutes(fastify: FastifyInstance) {
  // Register auth middleware for places routes
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
    if (request.url.startsWith('/api/places')) {
      await supabaseAuthMiddleware(request, reply);
      await requireAuth(request, reply);
    }
  });

  // GET /api/places/autocomplete - Get autocomplete predictions
  fastify.get(
    '/api/places/autocomplete',
    {
      schema: {
        description: 'Get place autocomplete predictions from Google Places API',
        tags: ['places'],
        querystring: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'Search text for autocomplete' },
          },
          required: ['input'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              predictions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    place_id: { type: 'string' },
                    description: { type: 'string' },
                    structured_formatting: {
                      type: 'object',
                      properties: {
                        main_text: { type: 'string' },
                        secondary_text: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const query = request.query as Record<string, any>;
        const input = query.input as string;

        if (!input) {
          return reply.status(400).send({ error: 'input parameter is required' });
        }

        const result = await getPlaceAutocomplete(input);
        return reply.status(200).send(result);
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/places/autocomplete');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );

  // GET /api/places/details - Get place details
  fastify.get(
    '/api/places/details',
    {
      schema: {
        description: 'Get detailed information about a place from Google Places API',
        tags: ['places'],
        querystring: {
          type: 'object',
          properties: {
            place_id: { type: 'string', description: 'Google Places ID' },
          },
          required: ['place_id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formatted_address: { type: 'string' },
              lat: { type: 'number' },
              lng: { type: 'number' },
              types: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const query = request.query as Record<string, any>;
        const placeId = query.place_id as string;

        if (!placeId) {
          return reply.status(400).send({ error: 'place_id parameter is required' });
        }

        const result = await getPlaceDetails(placeId);

        if (!result) {
          return reply.status(404).send({ error: 'Place not found' });
        }

        return reply.status(200).send(result);
      } catch (error) {
        console.error({ err: error }, 'Error in GET /api/places/details');
        return reply.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  );
}
