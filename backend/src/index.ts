import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import { registerProfileRoutes } from './routes/profiles.js';
import { registerFlagsRoutes } from './routes/flags.js';
import { registerDatesRoutes } from './routes/dates.js';
import { registerUploadRoutes } from './routes/upload.js';
import { registerAnalyticsRoutes } from './routes/analytics.js';
import { registerRemindersRoutes } from './routes/reminders.js';
import { registerInteractionsRoutes } from './routes/interactions.js';

// Combine schemas for Better Auth
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication and storage
app.withAuth();
app.withStorage();

// Register routes
registerProfileRoutes(app, app.fastify);
registerFlagsRoutes(app, app.fastify);
registerDatesRoutes(app, app.fastify);
registerUploadRoutes(app, app.fastify);
registerAnalyticsRoutes(app, app.fastify);
registerRemindersRoutes(app, app.fastify);
registerInteractionsRoutes(app, app.fastify);

await app.run();
app.logger.info('Application running');
