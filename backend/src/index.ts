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

// Combine schemas for Better Auth
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Run database migrations on startup
app.logger.info('Running database migrations on startup');
try {
  await runMigrations({ logger: app.logger });
  app.logger.info('Database migrations completed successfully');
} catch (error) {
  app.logger.warn({ err: error }, 'Migration check during startup');
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
