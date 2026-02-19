import mongoose from 'mongoose';
import { config } from '../config';
import pino from 'pino';

const logger = pino();

declare global {
  var mongoose: { conn: any; promise: any } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async (): Promise<void> => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(config.mongoUri, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
    logger.info('MongoDB connected successfully');
  } catch (error) {
    cached.promise = null;
    logger.error(error, 'MongoDB connection failed');
    throw error;
  }
};
