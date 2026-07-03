import app from './app';
import { env } from './utils/env';
import { appLogger, errorLogger } from './config/logger';
import { prisma } from './config/database';

async function main() {
  try {
    await prisma.$connect();
    appLogger.info('Database connected', { environment: env.nodeEnv });

    app.listen(env.port, () => {
      appLogger.info('Server started', {
        port: env.port,
        environment: env.nodeEnv,
        corsOrigin: env.corsOrigin,
      });
    });
  } catch (error) {
    errorLogger.error('Failed to start server', { error });
    process.exit(1);
  }
}

main();

process.on('SIGINT', async () => {
  appLogger.info('Shutting down server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  errorLogger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (error) => {
  errorLogger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});
