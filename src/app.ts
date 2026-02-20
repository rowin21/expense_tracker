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
app.use('/v1/swagger/main.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(scriptContent);
});

// Relax CSP for Swagger to allow Elements UI to function correctly
app.use('/v1/swagger', (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline'; img-src * data: blob:; connect-src *;",
  );
  next();
});

app.use(
  '/v1/swagger',
  express.static(path.join(process.cwd(), 'public/swagger')),
);

app.use(express.static('public'));

// Routes
app.use('/v1', router);

// Error Handling
app.use(errorHandler);

export default app;
