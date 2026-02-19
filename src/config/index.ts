import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGO_URI: z.string().url(),
  WHATSAPP_API_URL: z.string().url(),
  WHATSAPP_AUTH_TOKEN: z.string().min(1),
  SWAGGER_URLS: z.string().default('http://localhost:3000/v1'), // Default URL for dev
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('Environment validation failed:', envVars.error.format());
  process.exit(1);
}

interface Config {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  mongoUri: string;
  whatsappApiUrl: string;
  whatsappAuthToken: string;
  swaggerUrls: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
}

export const config: Config = {
  port: parseInt(envVars.data.PORT, 10),
  nodeEnv: envVars.data.NODE_ENV,
  mongoUri: envVars.data.MONGO_URI,
  whatsappApiUrl: envVars.data.WHATSAPP_API_URL,
  whatsappAuthToken: envVars.data.WHATSAPP_AUTH_TOKEN,
  swaggerUrls: envVars.data.SWAGGER_URLS,
  jwtAccessSecret: envVars.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: envVars.data.JWT_REFRESH_SECRET,
  jwtAccessExpiry: envVars.data.JWT_ACCESS_EXPIRY,
  jwtRefreshExpiry: envVars.data.JWT_REFRESH_EXPIRY,
};
