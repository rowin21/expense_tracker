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
// 1. Root health check for Render
app.get('/', (req, res) =>
  res.status(200).json({ status: 'ok', message: 'Expense Tracker API' }),
);

// 2. Serve the dynamic main.js with high priority (bypass filesystem)
app.get(['/v1/swagger/main.js', '/swagger/main.js'], (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );
  res.send(scriptContent);
});

// 3. Relax CSP for Swagger
app.use(['/v1/swagger', '/swagger'], (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline'; img-src * data: blob:; connect-src *;",
  );
  next();
});

// 4. Static assets for Swagger UI
app.use(
  '/v1/swagger',
  express.static(path.join(process.cwd(), 'public/swagger')),
);
app.use('/swagger', express.static(path.join(process.cwd(), 'public/swagger')));

// 5. General static files
app.use(express.static('public'));

// Routes
app.use('/v1', router);

// Error Handling
app.use(errorHandler);

export default app;
