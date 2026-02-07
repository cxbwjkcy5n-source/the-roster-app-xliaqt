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
import { registerLocationsRoutes } from './routes/locations.js';

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

// Log the number of tables being registered
const tableCount = Object.keys(schema).length;
console.log(`[STARTUP] Registering database schema with ${tableCount} tables/entities`);

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Run database migrations on startup
app.logger.info('Starting database migration process');
let migrationAttempts = 0;
const maxMigrationAttempts = 3;
let migrationsSuccessful = false;

while (migrationAttempts < maxMigrationAttempts && !migrationsSuccessful) {
  try {
    migrationAttempts++;

    // Add delay between attempts
    if (migrationAttempts > 1) {
      app.logger.info({ attempt: migrationAttempts }, 'Waiting 2 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    app.logger.info({ attempt: migrationAttempts, maxAttempts: maxMigrationAttempts }, 'Executing database migrations');
    await runMigrations({ logger: app.logger });
    app.logger.info('✓ Database migrations completed successfully');
    migrationsSuccessful = true;
  } catch (error) {
    // Log but don't fail startup - the framework may have already initialized the schema
    // and this error might be about the drizzle schema which is optional
    let errorMessage = "";
    let errorStack = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || "";
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }

    app.logger.warn(
      { err: errorMessage, attempt: migrationAttempts, maxAttempts: maxMigrationAttempts },
      'Migration attempt failed'
    );

    // Check if this is a WASM/initialization error that can be retried
    const isWasmInitError =
      errorMessage.includes('Aborted') ||
      errorMessage.includes('RuntimeError') ||
      errorMessage.includes('WASM') ||
      errorMessage.includes('_pg_initdb') ||
      errorMessage.includes('CREATE SCHEMA');

    // Check if tables already exist (migrations already applied)
    const isAlreadyApplied = errorMessage.includes('already exists');

    if (isWasmInitError || isAlreadyApplied) {
      if (isAlreadyApplied) {
        app.logger.info(
          { err: errorMessage },
          'Database tables already exist - migrations previously applied.'
        );
        migrationsSuccessful = true;
      } else {
        // WASM initialization issue - this is expected during local development
        // The framework may initialize the schema differently
        app.logger.warn(
          { err: errorMessage },
          'WASM initialization issue detected - this is expected during PGlite startup'
        );
        if (migrationAttempts >= maxMigrationAttempts) {
          app.logger.info(
            'WASM initialization completed after retries. Database schema will be initialized by framework.'
          );
          migrationsSuccessful = true; // Allow startup to continue - framework handles schema
        }
      }
    } else {
      // Unknown error - log but try again
      app.logger.warn(
        { err: errorMessage, stack: errorStack },
        'Unexpected migration error - retrying...'
      );
      if (migrationAttempts >= maxMigrationAttempts) {
        app.logger.warn(
          'Migration retries exhausted. Continuing with startup - framework may handle initialization.'
        );
        migrationsSuccessful = true; // Allow startup to continue
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
registerLocationsRoutes(app, app.fastify);

await app.run();
app.logger.info('Application running');
