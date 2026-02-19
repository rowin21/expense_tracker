import mongoose from 'mongoose';
import { config } from '../config';
import pino from 'pino';

const logger = pino();

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(error, 'MongoDB connection failed');
    process.exit(1);
  }
};
