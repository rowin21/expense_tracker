import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';

import { config } from './config';

const normalizePath = (p: string) => p.replace(/\\/g, '/');

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Tracker API',
      description: 'API Documentation for the Expense Tracker Application',
      version: '1.0.0',
    },
    servers: config.swaggerUrls.split(',').map((url) => ({ url: url.trim() })),
    components: {
      securitySchemes: {
        userBearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Specify the user token',
        },
      },
      parameters: {
        XDemoHeader: {
          name: 'X-Demo',
          in: 'header',
          description:
            "Set to 'true' to use the demo database, 'false' or omit for main database.",
          required: false,
          schema: {
            type: 'string',
            enum: ['true', 'false'],
          },
        },
      },
    },
    security: [],
  },
  apis: [
    normalizePath(path.join(process.cwd(), 'src/routes/**/*.ts')),
    normalizePath(path.join(process.cwd(), 'src/controller/**/*.ts')),
    normalizePath(path.join(process.cwd(), 'src/db/models/**/*.ts')),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const scriptContent = `(async () => {
    const docs = document.getElementById('docs');
    const apiDescriptionDocument = ${JSON.stringify(swaggerSpec)};
    docs.apiDescriptionDocument = apiDescriptionDocument;
  })();
`;

if (
  !process.env.VERCEL &&
  !process.env.RENDER &&
  !process.env.NETLIFY &&
  process.env.NODE_ENV !== 'production'
) {
  const filePath = path.join(process.cwd(), 'public/swagger/main.js');
  fs.writeFile(filePath, scriptContent, (err) => {
    if (err) {
      logger.error({ err }, 'Error writing to file:');
      return;
    }
    logger.info('File has been written successfully.');
  });
}

export { swaggerUi, swaggerSpec, scriptContent };
