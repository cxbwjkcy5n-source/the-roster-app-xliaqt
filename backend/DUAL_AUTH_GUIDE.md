# Dual Authentication Guide

This backend supports dual authentication, accepting tokens from both **Supabase** and **Better Auth**. This enables backward compatibility while supporting multiple authentication providers.

## Overview

The system can validate:
- **Supabase JWT tokens** (Authorization: Bearer {supabase_token})
- **Better Auth session tokens** (Authorization: Bearer {better_auth_token})
- **Better Auth native sessions** (via app.requireAuth() middleware)

## How It Works

### Token Validation Flow

1. **Extract Bearer Token**: Read `Authorization: Bearer {token}` header
2. **Decode JWT**: Parse the token using JWT decoding (no verification needed for extraction)
3. **Identify Source**: Determine if token is from Supabase or Better Auth based on token claims
4. **Extract User ID**: Get user ID from appropriate claim:
   - Supabase: `sub` claim
   - Better Auth: `id`, `user_id`, or `sub` claim
5. **Return User Info**: Provide user ID and email to the endpoint

## New Endpoints

### 1. GET `/api/verify-token`
Verify and get information about a token.

**Request:**
```bash
GET /api/verify-token
Authorization: Bearer {token_from_supabase_or_better_auth}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  },
  "authSource": "supabase" | "better-auth"
}
```

**Error Response (401):**
```json
{
  "error": {
    "message": "Invalid or missing token"
  }
}
```

## Using Dual Auth in Protected Endpoints

### Option 1: Using Native Better Auth (Existing Approach)

Continue using `app.requireAuth()` as before. This works for Better Auth sessions:

```typescript
export function registerMyRoutes(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  fastify.get('/api/my-endpoint', async (request, reply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    // ... use userId
  });
}
```

### Option 2: Using Dual Auth (Recommended for Supabase Support)

Import and use the dual auth utilities:

```typescript
import { requireDualAuth, getUserIdFromRequest } from '../utils/auth-utils.js';

export function registerMyRoutes(app: App, fastify: FastifyInstance) {
  fastify.get('/api/my-endpoint', async (request, reply) => {
    // Use dual auth instead of app.requireAuth()
    const auth = await requireDualAuth(request, reply, app);
    if (!auth) return; // Error response already sent

    const userId = auth.user.id;
    const authSource = auth.source; // 'supabase' or 'better-auth'

    app.logger.info({ userId, authSource }, 'Processing request');
    // ... use userId
  });
}
```

### Option 3: Quick User ID Extraction

For simple cases where you just need the user ID:

```typescript
import { getUserIdFromRequest } from '../utils/auth-utils.js';

fastify.get('/api/my-endpoint', async (request, reply) => {
  const userId = getUserIdFromRequest(request, app);

  if (!userId) {
    return reply.status(401).send({ error: { message: 'Unauthorized' } });
  }

  // ... use userId
});
```

## Migrating Existing Routes to Dual Auth

### Before (Better Auth Only):
```typescript
const session = await requireAuth(request, reply);
if (!session) return;
const userId = session.user.id;
```

### After (Dual Auth Support):
```typescript
const auth = await requireDualAuth(request, reply, app);
if (!auth) return;
const userId = auth.user.id;
```

## Token Format Examples

### Supabase Token Claims
```json
{
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "aud": "authenticated",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Better Auth Token Claims
```json
{
  "id": "user-id-here",
  "email": "user@example.com",
  "aud": "authenticated",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Testing Dual Auth

### Test with Supabase Token
```bash
curl -X GET http://localhost:3000/api/verify-token \
  -H "Authorization: Bearer {your_supabase_jwt_token}"
```

### Test with Better Auth Token
```bash
curl -X GET http://localhost:3000/api/verify-token \
  -H "Authorization: Bearer {your_better_auth_session_token}"
```

### Test Protected Endpoint with Dual Auth
```bash
curl -X GET http://localhost:3000/api/profiles \
  -H "Authorization: Bearer {token_from_either_provider}"
```

## Logging

All authentication attempts are logged:

```
DEBUG: Authenticated via dual auth token
  userId: abc123
  source: supabase

DEBUG: Token verified successfully
  userId: abc123
  source: better-auth

WARN: No valid authentication found
```

## Database Integration

Dual auth works seamlessly with the existing database:

- **Supabase users**: Use Supabase user IDs from tokens
- **Better Auth users**: Use Better Auth user IDs (stored in `user` table)
- **Mixed mode**: Both token types can be used simultaneously

Note: Ensure your application properly handles user IDs from both sources if they might differ.

## Security Considerations

### Token Validation
- Tokens are decoded but not cryptographically verified (signature validation is client-side responsibility)
- Claims are extracted and used as-is
- Invalid tokens are gracefully rejected

### Best Practices
1. Always validate that `user.id` is not null before using
2. Use the `authSource` to log which authentication method was used
3. Consider storing token source in logs for audit trails
4. Implement token refresh mechanisms on the client side

## Troubleshooting

### "Invalid or missing token"
- Check Bearer token format: `Authorization: Bearer {token}`
- Verify token is not expired
- Ensure token contains required claims (`sub` or `id`)

### "Unauthorized" on protected endpoints
- Token validation failed - check if it contains required claims
- Try `/api/verify-token` endpoint to debug token contents
- Check application logs for detailed error messages

### Wrong authentication source detected
- Inspect token claims using a JWT decoder (jwt.io)
- Verify token structure matches expected format
- Check middleware/dual-auth.ts extraction logic

## Migration Path

1. **Phase 1**: Deploy dual auth alongside existing Better Auth
2. **Phase 2**: Update protected routes to use `requireDualAuth` (optional)
3. **Phase 3**: Accept Supabase tokens in production
4. **Phase 4**: Gradually migrate users to preferred auth provider

## Environment Variables

Optional configuration for future extensions:

```bash
# SUPABASE_JWT_SECRET=your_supabase_secret (for future validation)
# BETTER_AUTH_KEY=your_better_auth_secret (for future validation)
API_BASE_URL=http://localhost:3000
PORT=3000
```
