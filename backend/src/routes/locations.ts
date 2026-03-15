import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';
import { requireDualAuth, ensureUserExists } from '../utils/auth-utils.js';
import { gateway } from '@specific-dev/framework';
import { generateObject } from 'ai';
import { z } from 'zod';

const locationSchema = z.object({
  locations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      address: z.string(),
      coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
    })
  ),
});

type LocationSearchResult = z.infer<typeof locationSchema>;

export function registerLocationsRoutes(app: App, fastify: FastifyInstance) {
  // Search for locations/addresses
  fastify.get<{ Querystring: { query: string } }>(
    '/api/locations/search',
    {
      schema: {
        description: 'Search for locations and addresses',
        tags: ['locations'],
        querystring: {
          type: 'object',
          properties: {
            query: { type: 'string' },
          },
          required: ['query'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                address: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireDualAuth(request, reply, app);
      if (!session) return;

      await ensureUserExists(app, session.user.id);

      const { query } = request.query as { query: string };

      if (!query || query.trim().length === 0) {
        app.logger.warn({ userId: session.user.id }, 'Location search with empty query');
        return reply.status(400).send({ error: 'Search query is required' });
      }

      app.logger.info({ userId: session.user.id, query }, 'Searching for locations');

      try {
        // Use AI to generate realistic location search results
        const { object } = await generateObject({
          model: gateway('openai/gpt-4o'),
          schema: locationSchema,
          prompt: `Search for locations matching "${query}". Return realistic locations with names, addresses, and approximate coordinates if available. Include popular restaurants, bars, parks, museums, coffee shops, and other date venues matching the search term. Provide at least 3-5 relevant results.`,
        });

        app.logger.info(
          { userId: session.user.id, query, count: object.locations.length },
          'Location search results returned'
        );

        return object.locations;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, query }, 'Failed to search locations');
        return reply.status(500).send({ error: 'Failed to search locations. Please try again.' });
      }
    }
  );
}
