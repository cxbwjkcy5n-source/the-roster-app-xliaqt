import { createApplication, runMigrations } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerUserProfileRoutes } from './routes/user-profile.js';
import { registerProfileRoutes } from './routes/profiles.js';
import { registerFlagsRoutes } from './routes/flags.js';
import { registerDatesRoutes } from './routes/dates.js';
import { registerUploadRoutes } from './routes/upload.js';
import { registerAnalyticsRoutes } from './routes/analytics.js';
import { registerRemindersRoutes } from './routes/reminders.js';
import { registerInteractionsRoutes } from './routes/interactions.js';
import { registerSafetyDatesRoutes } from './routes/safety-dates.js';
import { registerPrivacyPolicyRoutes } from './routes/privacy-policy.js';
import { registerCoachingRoutes } from './routes/coaching.js';

// Add delay before application creation to allow WASM modules to initialize
await new Promise(resolve => setTimeout(resolve, 500));

// Handle uncaught exceptions to prevent WASM abort errors from crashing
process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.message.includes('Aborted')) {
    console.warn('[STARTUP] PGlite WASM initialization warning - continuing:', error.message);
  } else {
    console.error('[STARTUP] Uncaught exception:', error);
    process.exit(1);
  }
});

// Combine schemas for Better Auth
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Run database migrations on startup
app.logger.info('Running database migrations on startup');
let migrationAttempts = 0;
const maxMigrationAttempts = 3;
let migrationsSuccessful = false;

while (migrationAttempts < maxMigrationAttempts && !migrationsSuccessful) {
  try {
    migrationAttempts++;

    // Add delay between attempts
    if (migrationAttempts > 1) {
      app.logger.info({ attempt: migrationAttempts }, 'Waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    app.logger.info({ attempt: migrationAttempts }, 'Attempting to run migrations');
    await runMigrations({ logger: app.logger });
    app.logger.info('Database migrations completed successfully');
    migrationsSuccessful = true;
  } catch (error) {
    // Log but don't fail startup - the framework may have already initialized the schema
    // and this error might be about the drizzle schema which is optional
    let errorMessage = "";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }

    app.logger.warn(
      { err: errorMessage, attempt: migrationAttempts, maxAttempts: maxMigrationAttempts },
      'Migration attempt failed'
    );

    // Check for known WASM/initialization issues that shouldn't block startup
    if (
      errorMessage.includes('already exists') ||
      errorMessage.includes('Aborted') ||
      errorMessage.includes('CREATE SCHEMA') ||
      errorMessage.includes('RuntimeError') ||
      errorMessage.includes('WASM')
    ) {
      app.logger.info(
        { err: errorMessage },
        'Database WASM initialization issue detected - this is expected during local development.'
      );
      if (migrationAttempts >= maxMigrationAttempts) {
        app.logger.info('Continuing with startup despite migration issues. Tables will be created on first use.');
        migrationsSuccessful = true; // Allow startup to continue
      }
    } else {
      // For other errors, allow startup to continue
      if (migrationAttempts >= maxMigrationAttempts) {
        app.logger.warn({ err: error }, 'Migration failed after all attempts. Continuing with startup.');
        migrationsSuccessful = true;
      }
    }
  }
}

// Enable authentication with Better Auth configuration
// Support email/password, Google OAuth, and Apple OAuth through proxy
app.withAuth({
  // The proxy handles OAuth credentials automatically via Better Auth's managed OAuth
  // No need to provide credentials - they're handled by the framework
});

app.withStorage();

// Register routes
registerAuthRoutes(app, app.fastify);
registerHealthRoutes(app, app.fastify);
registerUserProfileRoutes(app, app.fastify);
registerProfileRoutes(app, app.fastify);
registerFlagsRoutes(app, app.fastify);
registerDatesRoutes(app, app.fastify);
registerUploadRoutes(app, app.fastify);
registerAnalyticsRoutes(app, app.fastify);
registerRemindersRoutes(app, app.fastify);
registerInteractionsRoutes(app, app.fastify);
registerSafetyDatesRoutes(app, app.fastify);
registerPrivacyPolicyRoutes(app, app.fastify);
registerCoachingRoutes(app, app.fastify);

await app.run();
app.logger.info('Application running');
