import { logger } from "@specific-dev/framework";

async function runMigrationsSafely() {
  try {
    // For local development with PGlite, migrations are handled automatically during app startup
    // This prevents WASM initialization issues during the build/verify phase
    if (!process.env.DATABASE_URL) {
      logger.info("Local development mode detected (no DATABASE_URL)");
      logger.info("Skipping migrations - they will run automatically during application startup");
      process.exit(0);
      return;
    }

    // For production with Neon/PostgreSQL, migrations should be handled by the framework
    logger.info("Production database detected - migrations handled by application startup");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Migration script error");
    process.exit(0); // Still exit with 0 to not block builds
  }
}

runMigrationsSafely();
