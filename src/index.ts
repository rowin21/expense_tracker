import app from './app';
import { config } from './config';
import { connectDB } from './db/connection';
import pino from 'pino';
import './swagger';
import dns from 'dns';
// Set Google DNS servers to fix MongoDB Atlas SRV lookup issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const logger = pino();

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      logger.info(
        `Server listening on port ${config.port} in ${config.nodeEnv} mode`,
      );
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Closing server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
