import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string;
  profileCompleted?: boolean;
}

interface AuthSession {
  token: string;
  expiresAt: string;
}

interface AuthResponse {
  user?: AuthUser;
  session?: AuthSession;
  message?: string;
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

export function registerAuthRoutes(app: App, fastify: FastifyInstance) {
  // Sign in endpoint - delegates to Better Auth
  fastify.post<{
    Body: {
      email: string;
      password: string;
    };
  }>(
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
                  profileCompleted: { type: 'boolean' },
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
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

        // Validate input
        if (!email || !password) {
          return reply.status(400).send({
            error: { message: 'Email and password are required' },
          });
        }

        // Call Better Auth's sign-in endpoint via the internal auth client
        const signInResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/auth/sign-in/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!signInResponse.ok) {
          const error = (await signInResponse.json()) as ErrorResponse;
          app.logger.warn({ email, status: signInResponse.status }, 'Sign-in failed');
          return reply.status(signInResponse.status).send({
            error: { message: error.message || 'Invalid email or password' },
          });
        }

        const data = (await signInResponse.json()) as AuthResponse;

        return reply.send({
          user: {
            id: data.user?.id,
            email: data.user?.email,
            name: data.user?.name,
            emailVerified: data.user?.emailVerified,
            image: data.user?.image,
            profileCompleted: data.user?.profileCompleted,
          },
          session: {
            token: data.session?.token,
            expiresAt: data.session?.expiresAt,
          },
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Sign-in error');
        return reply.status(500).send({
          error: { message: 'Sign-in failed. Please try again.' },
        });
      }
    }
  );

  // Sign up endpoint
  fastify.post<{
    Body: {
      email: string;
      password: string;
      name: string;
    };
  }>(
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
                  profileCompleted: { type: 'boolean' },
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
        const { email, password, name } = request.body as {
          email: string;
          password: string;
          name: string;
        };

        // Validate input
        if (!email || !password || !name) {
          return reply.status(400).send({
            error: { message: 'Email, password, and name are required' },
          });
        }

        if (password.length < 8) {
          return reply.status(400).send({
            error: { message: 'Password must be at least 8 characters' },
          });
        }

        // Call Better Auth's sign-up endpoint
        const signUpResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/auth/sign-up/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });

        if (!signUpResponse.ok) {
          const error = (await signUpResponse.json()) as ErrorResponse;
          app.logger.warn({ email, status: signUpResponse.status }, 'Sign-up failed');
          return reply.status(signUpResponse.status).send({
            error: { message: error.message || 'Sign-up failed' },
          });
        }

        const data = (await signUpResponse.json()) as AuthResponse;

        return reply.status(201).send({
          user: {
            id: data.user?.id,
            email: data.user?.email,
            name: data.user?.name,
            emailVerified: data.user?.emailVerified,
            image: data.user?.image,
            profileCompleted: data.user?.profileCompleted,
          },
          session: {
            token: data.session?.token,
            expiresAt: data.session?.expiresAt,
          },
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Sign-up error');
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
                  profileCompleted: { type: 'boolean' },
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

        // Call Better Auth's get-session endpoint with token
        const sessionResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/auth/get-session`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!sessionResponse.ok) {
          return reply.status(401).send({
            error: { message: 'Invalid or expired session' },
          });
        }

        const data = (await sessionResponse.json()) as AuthResponse;

        return reply.send({
          user: {
            id: data.user?.id,
            email: data.user?.email,
            name: data.user?.name,
            emailVerified: data.user?.emailVerified,
            image: data.user?.image,
            profileCompleted: data.user?.profileCompleted,
          },
          session: {
            token: data.session?.token || token,
            expiresAt: data.session?.expiresAt,
          },
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Session check error');
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
          // Call Better Auth's sign-out endpoint
          await fetch(`http://localhost:${process.env.PORT || 3000}/api/auth/sign-out`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }

        return reply.send({
          message: 'Signed out successfully',
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Sign-out error');
        return reply.status(500).send({
          error: { message: 'Sign-out failed' },
        });
      }
    }
  );
}
