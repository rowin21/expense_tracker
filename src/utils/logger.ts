import pino from 'pino';
import { config } from '../config';

const isCloud = process.env.VERCEL || process.env.RENDER || process.env.NETLIFY;
const isDev = config.nodeEnv === 'development' && !isCloud;

export const logger = pino({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
