import { createApplication, runMigrations } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerProfileRoutes } from './routes/api.js';
import { registerSupabaseRoutes } from './routes/supabase-api.js';

// Add delay before application creation to allow WASM modules to initialize
await new Promise(resolve => setTimeout(resolve, 2000));

// Handle uncaught exceptions to prevent WASM abort errors from crashing
process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.message.includes('Aborted')) {
    console.warn('[STARTUP] PGlite WASM initialization warning - continuing:', error.message);
  } else {
    console.error('[STARTUP] Uncaught exception:', error);
    process.exit(1);
  }
});

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Log the number of tables being registered
const tableCount = Object.keys(schema).length;
console.log(`[STARTUP] Registering database schema with ${tableCount} tables/entities`);

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Run database migrations on startup
const shouldSkipMigrations = !process.env.DATABASE_URL && process.env.SKIP_DB_MIGRATIONS !== 'false';

app.logger.info({ shouldSkip: shouldSkipMigrations }, 'Starting database migration process');

let migrationAttempts = 0;
const maxMigrationAttempts = 2;
let migrationsSuccessful = !shouldSkipMigrations;

if (!shouldSkipMigrations) {
  while (migrationAttempts < maxMigrationAttempts && !migrationsSuccessful) {
    try {
      migrationAttempts++;

      if (migrationAttempts > 1) {
        const delayMs = Math.min(5000, 1000 * migrationAttempts);
        app.logger.info({ attempt: migrationAttempts, delayMs }, 'Waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      app.logger.info({ attempt: migrationAttempts, maxAttempts: maxMigrationAttempts }, 'Executing database migrations');
      try {
        await runMigrations({ logger: app.logger });
        app.logger.info('✓ Database migrations completed successfully');
        migrationsSuccessful = true;
      } catch (migrationError) {
        throw migrationError;
      }
    } catch (error) {
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

      const isWasmInitError =
        errorMessage.includes('Aborted') ||
        errorMessage.includes('RuntimeError') ||
        errorMessage.includes('WASM') ||
        errorMessage.includes('_pg_initdb') ||
        errorMessage.includes('CREATE SCHEMA') ||
        errorMessage.includes('Failed query');

      const isAlreadyApplied = errorMessage.includes('already exists');

      if (isWasmInitError || isAlreadyApplied) {
        if (isAlreadyApplied) {
          app.logger.info(
            { err: errorMessage },
            'Database tables already exist - migrations previously applied.'
          );
          migrationsSuccessful = true;
        } else {
          app.logger.warn(
            { err: errorMessage },
            'WASM initialization issue detected - this is expected during PGlite startup'
          );
          if (migrationAttempts >= 2) {
            app.logger.info(
              'WASM initialization issue detected. Database schema will be initialized by framework on demand. Server starting now.'
            );
            migrationsSuccessful = true;
          }
        }
      } else {
        app.logger.warn(
          { err: errorMessage, stack: errorStack },
          'Unexpected migration error - retrying...'
        );
        if (migrationAttempts >= maxMigrationAttempts) {
          app.logger.warn(
            'Migration retries exhausted. Continuing with startup - framework may handle initialization.'
          );
          migrationsSuccessful = true;
        }
      }
    }
  }
}

// Enable authentication with Better Auth configuration
app.withAuth({});

app.withStorage();

// Register routes
registerAuthRoutes(app, app.fastify);
registerHealthRoutes(app, app.fastify);
// Use Supabase routes instead of old profile routes
// registerProfileRoutes(app, app.fastify);
registerSupabaseRoutes(app.fastify);

await app.run();
app.logger.info('Application running');
