/**
 * Example: Using Dual Auth in Protected Routes
 *
 * This file demonstrates how to use the dual authentication system
 * (supporting both Supabase and Better Auth) in protected endpoints.
 *
 * Copy patterns from this file to migrate existing routes or create new ones.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { requireDualAuth, getUserIdFromRequest, isAuthenticated } from '../utils/auth-utils.js';
import type { App } from '../index.js';

export function registerExampleDualAuthRoutes(app: App, fastify: FastifyInstance) {
  /**
   * Example 1: Full Dual Auth with explicit error handling
   * Use this pattern for endpoints that need complete control
   */
  fastify.get(
    '/api/example/full-auth',
    {
      schema: {
        description: 'Example endpoint with full dual auth',
        tags: ['example'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Authenticate using dual auth (supports Supabase and Better Auth)
        const auth = await requireDualAuth(request, reply, app);
        if (!auth) return; // Error response already sent by requireDualAuth

        const userId = auth.user.id;
        const authSource = auth.source; // 'supabase' or 'better-auth'

        app.logger.info(
          { userId, authSource, endpoint: '/example/full-auth' },
          'Request authenticated'
        );

        // Now you can use userId to query the database
        // Example: fetch user profiles
        if (authSource === 'supabase') {
          // For Supabase users, userId is the Supabase UUID
          app.logger.debug({ userId }, 'Processing Supabase user');
        } else {
          // For Better Auth users, userId is from the Better Auth database
          app.logger.debug({ userId }, 'Processing Better Auth user');
        }

        return reply.send({
          message: 'Authenticated successfully',
          userId,
          authSource,
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Error in full auth example');
        return reply.status(500).send({
          error: { message: 'Internal server error' },
        });
      }
    }
  );

  /**
   * Example 2: Simple User ID Extraction
   * Use this pattern for quick authentication checks
   */
  fastify.get(
    '/api/example/quick-auth',
    {
      schema: {
        description: 'Example endpoint with quick dual auth check',
        tags: ['example'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Quick way to get user ID from either auth source
        const userId = getUserIdFromRequest(request, app);

        if (!userId) {
          app.logger.warn('Quick auth check failed - no valid token');
          return reply.status(401).send({
            error: { message: 'Unauthorized' },
          });
        }

        app.logger.info({ userId }, 'Quick auth successful');

        return reply.send({
          message: 'Authenticated',
          userId,
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Error in quick auth example');
        return reply.status(500).send({
          error: { message: 'Internal server error' },
        });
      }
    }
  );

  /**
   * Example 3: Authentication Check Only
   * Use this pattern just to verify authentication without getting user details
   */
  fastify.get(
    '/api/example/check-auth',
    {
      schema: {
        description: 'Example endpoint with simple auth check',
        tags: ['example'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const isAuth = isAuthenticated(request, app);

        if (!isAuth) {
          return reply.status(401).send({
            error: { message: 'Unauthorized' },
          });
        }

        return reply.send({
          message: 'User is authenticated',
          authenticated: true,
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Error checking authentication');
        return reply.status(500).send({
          error: { message: 'Internal server error' },
        });
      }
    }
  );

  /**
   * Example 4: Protected Endpoint with Database Query
   * Use this pattern when you need to fetch user data from database
   */
  fastify.get(
    '/api/example/user-data',
    {
      schema: {
        description: 'Example endpoint fetching user data',
        tags: ['example'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth = await requireDualAuth(request, reply, app);
        if (!auth) return;

        const userId = auth.user.id;

        app.logger.info({ userId }, 'Fetching user data');

        // Example: fetch user's roster profiles from Better Auth integrated database
        const userProfiles = await app.db.query.rosterProfiles.findMany({
          where: eq(schema.rosterProfiles.userId, userId),
        });

        app.logger.info({ userId, count: userProfiles.length }, 'User data fetched');

        return reply.send({
          userId,
          authSource: auth.source,
          profiles: userProfiles,
          profileCount: userProfiles.length,
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Error fetching user data');
        return reply.status(500).send({
          error: { message: 'Internal server error' },
        });
      }
    }
  );

  /**
   * Example 5: POST Endpoint with Dual Auth
   * Use this pattern for creating resources owned by the authenticated user
   */
  fastify.post<{ Body: { name: string } }>(
    '/api/example/create-resource',
    {
      schema: {
        description: 'Example endpoint creating a resource for the user',
        tags: ['example'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
        response: { 201: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth = await requireDualAuth(request, reply, app);
        if (!auth) return;

        const userId = auth.user.id;
        const { name } = request.body as { name: string };

        // Validate input
        if (!name || name.trim().length === 0) {
          return reply.status(400).send({
            error: { message: 'Name is required' },
          });
        }

        app.logger.info(
          { userId, resourceName: name, authSource: auth.source },
          'Creating resource for user'
        );

        // Example: insert into database
        // const [resource] = await app.db.insert(schema.someTable).values({
        //   userId,
        //   name,
        // }).returning();

        return reply.status(201).send({
          message: 'Resource created',
          userId,
          name,
          authSource: auth.source,
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Error creating resource');
        return reply.status(500).send({
          error: { message: 'Internal server error' },
        });
      }
    }
  );

  /**
   * Example 6: Handling Different Auth Sources
   * Use this pattern when behavior differs by auth source
   */
  fastify.get(
    '/api/example/auth-aware',
    {
      schema: {
        description: 'Example endpoint with auth-source-aware logic',
        tags: ['example'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const auth = await requireDualAuth(request, reply, app);
        if (!auth) return;

        const userId = auth.user.id;

        if (auth.source === 'supabase') {
          // Handle Supabase users differently
          app.logger.info({ userId }, 'Processing Supabase user');
          return reply.send({
            message: 'Supabase user authenticated',
            userId,
            features: ['feature1', 'feature2'],
          });
        } else {
          // Handle Better Auth users
          app.logger.info({ userId }, 'Processing Better Auth user');
          return reply.send({
            message: 'Better Auth user authenticated',
            userId,
            features: ['feature1', 'feature2', 'feature3'],
          });
        }
      } catch (error) {
        app.logger.error({ err: error }, 'Error in auth-aware endpoint');
        return reply.status(500).send({
          error: { message: 'Internal server error' },
        });
      }
    }
  );
}

/**
 * How to use these examples:
 *
 * 1. Import and register the example routes in src/index.ts:
 *    import { registerExampleDualAuthRoutes } from './routes/example-dual-auth.js';
 *    registerExampleDualAuthRoutes(app, app.fastify);
 *
 * 2. Test the endpoints:
 *    curl -X GET http://localhost:3000/api/example/full-auth \
 *      -H "Authorization: Bearer {token_from_supabase_or_better_auth}"
 *
 * 3. Copy patterns to your own routes
 *
 * 4. Remove this example file when done
 */
