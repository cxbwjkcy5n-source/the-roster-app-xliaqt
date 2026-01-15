import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';
import type { App } from '../index.js';

interface SignInRequest {
  email: string;
  password: string;
}

interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    emailVerified?: boolean;
    image?: string;
  };
  session?: {
    token: string;
    expiresAt: string;
  };
  error?: {
    message: string;
  };
}

function getBaseUrl(request: FastifyRequest): string {
  // First try to use environment variable
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  // Fall back to constructing from request
  const protocol = request.protocol || 'http';
  const host = request.hostname || 'localhost';
  const port = process.env.PORT || 3000;

  // Don't include port if it's standard for the protocol
  if ((protocol === 'https' && port === '443') || (protocol === 'http' && port === '80')) {
    return `${protocol}://${host}`;
  }

  return `${protocol}://${host}:${port}`;
}

export function registerAuthRoutes(app: App, fastify: FastifyInstance) {
  // Health check endpoint for auth
  fastify.get(
    '/api/auth-health',
    {
      schema: {
        description: 'Health check for authentication system',
        tags: ['auth'],
        response: { 200: { type: 'object' } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Auth health check');
      return { status: 'ok', message: 'Authentication service is running' };
    }
  );

  // Sign in endpoint
  fastify.post<{ Body: SignInRequest }>(
    '/api/sign-in',
    {
      schema: {
        description: 'Sign in with email and password',
        tags: ['auth'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
          required: ['email', 'password'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  emailVerified: { type: 'boolean' },
                  image: { type: 'string' },
                },
              },
              session: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  expiresAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, password } = request.body as SignInRequest;

        // Validate input
        if (!email || !password) {
          app.logger.warn({ email }, 'Sign-in attempted with missing credentials');
          return reply.status(400).send({
            error: { message: 'Email and password are required' },
          });
        }

        app.logger.info({ email }, 'Sign-in attempt');

        // First verify user exists in database
        const existingUser = await app.db.query.user.findFirst({
          where: eq(authSchema.user.email, email),
        });

        if (!existingUser) {
          app.logger.warn({ email }, 'Sign-in failed: user not found');
          return reply.status(401).send({
            error: { message: 'Invalid email or password' },
          });
        }

        app.logger.info({ email, userId: existingUser.id }, 'User found in database');

        // Call Better Auth's sign-in endpoint
        const baseUrl = getBaseUrl(request);
        app.logger.debug({ baseUrl, email }, 'Calling Better Auth sign-in endpoint');

        const signInResponse = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        app.logger.debug({ status: signInResponse.status, email }, 'Better Auth sign-in response received');

        if (!signInResponse.ok) {
          const errorData = await signInResponse
            .json()
            .catch(() => ({ message: 'Unknown error' }));
          app.logger.warn(
            { email, status: signInResponse.status, error: errorData },
            'Better Auth sign-in failed'
          );
          return reply.status(401).send({
            error: { message: 'Invalid email or password' },
          });
        }

        const data = (await signInResponse.json()) as AuthResponse;

        if (!data.user || !data.session) {
          app.logger.error(
            { email, userId: existingUser.id },
            'Sign-in response missing user or session data'
          );
          return reply.status(500).send({
            error: { message: 'Authentication failed. Please try again.' },
          });
        }

        app.logger.info({ userId: data.user.id, email }, 'Sign-in successful');

        return reply.send({
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            emailVerified: data.user.emailVerified,
            image: data.user.image,
          },
          session: {
            token: data.session.token,
            expiresAt: data.session.expiresAt,
          },
        });
      } catch (error) {
        app.logger.error({ err: error, message: String(error) }, 'Sign-in error');
        return reply.status(500).send({
          error: { message: 'Sign-in failed. Please try again.' },
        });
      }
    }
  );

  // Sign up endpoint
  fastify.post<{ Body: SignUpRequest }>(
    '/api/sign-up',
    {
      schema: {
        description: 'Sign up with email and password',
        tags: ['auth'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string', minLength: 1 },
          },
          required: ['email', 'password', 'name'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  emailVerified: { type: 'boolean' },
                  image: { type: 'string' },
                },
              },
              session: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  expiresAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, password, name } = request.body as SignUpRequest;

        // Validate input
        if (!email || !password || !name) {
          app.logger.warn({ email, name }, 'Sign-up attempted with missing fields');
          return reply.status(400).send({
            error: { message: 'Email, password, and name are required' },
          });
        }

        if (password.length < 8) {
          app.logger.warn({ email }, 'Sign-up attempted with short password');
          return reply.status(400).send({
            error: { message: 'Password must be at least 8 characters' },
          });
        }

        app.logger.info({ email, name }, 'Sign-up attempt');

        // Check if email already exists
        const existingUser = await app.db.query.user.findFirst({
          where: eq(authSchema.user.email, email),
        });

        if (existingUser) {
          app.logger.warn({ email }, 'Sign-up failed: email already registered');
          return reply.status(400).send({
            error: { message: 'This email is already registered' },
          });
        }

        // Call Better Auth's sign-up endpoint
        const baseUrl = getBaseUrl(request);
        app.logger.debug({ baseUrl, email }, 'Calling Better Auth sign-up endpoint');

        const signUpResponse = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        app.logger.debug({ status: signUpResponse.status, email }, 'Better Auth sign-up response received');

        if (!signUpResponse.ok) {
          const errorData = (await signUpResponse.json().catch(() => ({ message: 'Unknown error' }))) as {
            message?: string;
          };
          app.logger.warn(
            { email, status: signUpResponse.status, error: errorData },
            'Better Auth sign-up failed'
          );
          return reply.status(signUpResponse.status).send({
            error: {
              message:
                errorData.message || 'Sign-up failed. This email may already be registered.',
            },
          });
        }

        const data = (await signUpResponse.json()) as AuthResponse;

        if (!data.user || !data.session) {
          app.logger.error({ email }, 'Sign-up response missing user or session data');
          return reply.status(500).send({
            error: { message: 'Registration failed. Please try again.' },
          });
        }

        app.logger.info({ userId: data.user.id, email, name }, 'Sign-up successful');

        return reply.status(201).send({
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            emailVerified: data.user.emailVerified,
            image: data.user.image,
          },
          session: {
            token: data.session.token,
            expiresAt: data.session.expiresAt,
          },
        });
      } catch (error) {
        app.logger.error({ err: error, message: String(error) }, 'Sign-up error');
        return reply.status(500).send({
          error: { message: 'Sign-up failed. Please try again.' },
        });
      }
    }
  );

  // Get current session
  fastify.get(
    '/api/session',
    {
      schema: {
        description: 'Get current user session',
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  emailVerified: { type: 'boolean' },
                  image: { type: 'string' },
                },
              },
              session: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  expiresAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get token from headers
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return reply.status(401).send({
            error: { message: 'No session token provided' },
          });
        }

        const token = authHeader.substring(7);

        app.logger.info('Fetching session');

        // Call Better Auth's get-session endpoint
        const baseUrl = getBaseUrl(request);
        app.logger.debug({ baseUrl }, 'Calling Better Auth get-session endpoint');

        const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        app.logger.debug({ status: sessionResponse.status }, 'Better Auth session response received');

        if (!sessionResponse.ok) {
          app.logger.warn({ status: sessionResponse.status }, 'Session fetch failed');
          return reply.status(401).send({
            error: { message: 'Invalid or expired session' },
          });
        }

        const data = (await sessionResponse.json()) as AuthResponse;

        if (!data.user || !data.session) {
          app.logger.error('Session response missing user or session data');
          return reply.status(401).send({
            error: { message: 'Invalid session' },
          });
        }

        app.logger.info({ userId: data.user.id }, 'Session fetched successfully');

        return reply.send({
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            emailVerified: data.user.emailVerified,
            image: data.user.image,
          },
          session: {
            token: data.session.token || token,
            expiresAt: data.session.expiresAt,
          },
        });
      } catch (error) {
        app.logger.error({ err: error, message: String(error) }, 'Session check error');
        return reply.status(500).send({
          error: { message: 'Session check failed' },
        });
      }
    }
  );

  // Sign out endpoint
  fastify.post(
    '/api/sign-out',
    {
      schema: {
        description: 'Sign out the current user',
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization;
        const token = authHeader?.substring(7);

        if (token) {
          app.logger.info('Signing out user');

          // Call Better Auth's sign-out endpoint
          const baseUrl = getBaseUrl(request);
          app.logger.debug({ baseUrl }, 'Calling Better Auth sign-out endpoint');

          try {
            const signOutResponse = await fetch(`${baseUrl}/api/auth/sign-out`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            app.logger.debug({ status: signOutResponse.status }, 'Better Auth sign-out response received');
          } catch (fetchError) {
            app.logger.warn({ err: fetchError }, 'Better Auth sign-out request failed');
            // Continue anyway - we'll still return success
          }
        } else {
          app.logger.info('Sign-out requested without token');
        }

        return reply.send({
          message: 'Signed out successfully',
        });
      } catch (error) {
        app.logger.error({ err: error, message: String(error) }, 'Sign-out error');
        return reply.status(500).send({
          error: { message: 'Sign-out failed' },
        });
      }
    }
  );
}
