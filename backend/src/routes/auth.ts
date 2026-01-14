import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

/**
 * Better Auth provides all authentication endpoints automatically at /api/auth/*
 *
 * This file documents the available endpoints for reference.
 * No custom routes need to be created here.
 *
 * Available Better Auth Endpoints:
 *
 * Email/Password Authentication:
 * - POST /api/auth/sign-in/email - Sign in with email and password
 * - POST /api/auth/sign-up/email - Sign up with email and password
 * - POST /api/auth/reset-password - Request password reset
 * - POST /api/auth/reset-password/{token} - Reset password with token
 * - POST /api/auth/change-password - Change password
 * - POST /api/auth/change-email - Change email address
 *
 * Session Management:
 * - GET /api/auth/get-session - Get current user session (requires Bearer token)
 * - GET /api/auth/list-sessions - List all user sessions
 * - POST /api/auth/revoke-session - Revoke a specific session
 * - POST /api/auth/revoke-sessions - Revoke all sessions
 * - POST /api/auth/revoke-other-sessions - Revoke all except current
 * - POST /api/auth/sign-out - Sign out current session
 *
 * Social OAuth:
 * - POST /api/auth/sign-in/social - Sign in with OAuth provider (google, apple, github, etc.)
 * - POST /api/auth/link-social - Link social account to email account
 * - POST /api/auth/unlink-account - Unlink social account
 *
 * Email Verification:
 * - POST /api/auth/send-verification-email - Send verification email
 * - GET /api/auth/verify-email - Verify email address
 *
 * User Management:
 * - POST /api/auth/update-user - Update user profile
 * - POST /api/auth/delete-user - Delete user account
 * - GET /api/auth/account-info - Get linked accounts info
 * - GET /api/auth/list-accounts - List all linked accounts
 *
 * Utility:
 * - GET /api/auth/ok - Health check
 * - GET /api/auth/open-api/generate-schema - OpenAPI spec
 * - GET /api/auth/reference - Interactive API reference
 *
 * Request Format Examples:
 *
 * Sign In:
 * POST /api/auth/sign-in/email
 * Content-Type: application/json
 * Body: { "email": "user@example.com", "password": "password123" }
 *
 * Sign Up:
 * POST /api/auth/sign-up/email
 * Content-Type: application/json
 * Body: { "email": "user@example.com", "password": "password123", "name": "John Doe" }
 *
 * Get Session:
 * GET /api/auth/get-session
 * Authorization: Bearer {session_token}
 *
 * Sign Out:
 * POST /api/auth/sign-out
 * Authorization: Bearer {session_token}
 *
 * Response Format:
 * Success (200):
 * {
 *   "user": {
 *     "id": "user_id",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "emailVerified": true,
 *     "image": "https://...",
 *     "createdAt": "2024-01-01T00:00:00Z"
 *   },
 *   "session": {
 *     "token": "session_token",
 *     "expiresAt": "2024-01-02T00:00:00Z",
 *     "ipAddress": "192.168.1.1",
 *     "userAgent": "..."
 *   }
 * }
 *
 * Error (400/401/500):
 * {
 *   "error": {
 *     "message": "Invalid credentials",
 *     "code": "INVALID_CREDENTIALS"
 *   }
 * }
 */

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
}
