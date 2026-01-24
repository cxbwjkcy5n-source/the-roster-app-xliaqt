import type { FastifyReply } from 'fastify';

/**
 * Handles database errors and returns appropriate HTTP responses
 */
export function handleDatabaseError(
  error: unknown,
  reply: FastifyReply,
  logger: any,
  context: string
): boolean {
  let errorMessage = '';

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = JSON.stringify(error);
  }

  logger.error({ err: error, context, message: errorMessage }, 'Database error occurred');

  // Check for specific database errors
  if (
    errorMessage.includes('table') && errorMessage.includes('does not exist') ||
    errorMessage.includes('relation') && errorMessage.includes('does not exist') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('table not found')
  ) {
    logger.warn({ context }, 'Database table not found - tables may not be initialized');
    reply.code(503).send({
      error: 'Database is not properly initialized. Please wait for migrations to complete.',
      context,
    });
    return true;
  }

  if (
    errorMessage.includes('connection') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('connect ECONNREFUSED')
  ) {
    logger.error({ context }, 'Database connection failed');
    reply.code(503).send({
      error: 'Database connection unavailable.',
      context,
    });
    return true;
  }

  if (errorMessage.includes('Aborted') || errorMessage.includes('WASM')) {
    logger.warn({ context }, 'WASM initialization issue');
    reply.code(503).send({
      error: 'Database is initializing. Please try again in a moment.',
      context,
    });
    return true;
  }

  // Generic database error
  reply.code(500).send({
    error: 'Database operation failed. Please try again.',
    context,
  });
  return true;
}
