import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino-http';
import router from './routes';
import { entryPoint } from './middleware/entryPoint';
import { errorHandler } from './middleware/errorHandler';

import { connectDB } from './db/connection';

const app = express();
const logger = pino();

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Entry Point - Initialize Context
app.use(entryPoint);

// Security and CORS
app.use(helmet());
app.use(cors());

// Logging
app.use(logger);

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentation
import { scriptContent } from './swagger';

// Documentation
app.use(express.static('public'));
app.use('/v1/swagger/main.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(scriptContent);
});
app.use('/v1/swagger', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/swagger/index.html'));
});

// Routes
app.use('/v1', router);

// Error Handling
app.use(errorHandler);

export default app;
